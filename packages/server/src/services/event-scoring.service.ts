import { Prisma } from '@prisma/client'
import { computeAwards, PlayInputSchema, RulesConfigSchema } from '@extia-gaming/shared'
import { prisma } from '../lib/prisma.js'

export class EventError extends Error { constructor(message: string, public statusCode = 409) { super(message) } }
export async function eventTransaction<T>(work: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  for(let i=0;;i++) {
    try { return await prisma.$transaction(work,{isolationLevel:Prisma.TransactionIsolationLevel.Serializable}) }
    catch(error) {if(i<3 && error instanceof Prisma.PrismaClientKnownRequestError && error.code==='P2034') continue; throw error}
  }
}
export async function settleEvent(eventId:number,winnerId:number|null) {
  return eventTransaction(async tx => {
    const event = await tx.event.findUnique({where:{id:eventId},include:{userEvents:{where:{isPresent:true},orderBy:{userId:'asc'}}}})
    if(!event) throw new EventError('Événement introuvable',404)
    if(event.settledAt || !event.endsAt || event.endsAt > new Date()) throw new EventError('La distribution se fait une seule fois après la fin')
    const ids=event.userEvents.map(r=>r.userId)
    if(!ids.length) throw new EventError('Aucune présence confirmée')
    if(event.winnerShare>0 && (!winnerId || !ids.includes(winnerId))) throw new EventError('Choisissez un vainqueur parmi les présents')
    if(winnerId && !ids.includes(winnerId)) throw new EventError('Le vainqueur doit être présent')
    const awards=computeAwards(RulesConfigSchema.parse({type:'RULES',method:'MINIGAME',attendancePoints:event.pointsEarned,winnerShare:event.winnerShare}),PlayInputSchema.parse({calculType:'RULES',gameTypeId:1,values:{winnerId:winnerId??ids[0]}}),ids)
    await tx.eventAward.createMany({data:awards.map(a=>({eventId,userId:a.userId,points:a.score}))})
    await tx.event.update({where:{id:eventId},data:{settledAt:new Date(),winnerId}})
    return awards
  })
}
