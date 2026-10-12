import type { Prisma } from '@prisma/client'
import { HonorTiersSchema, roundScore, type HonorProgress } from '@extia-gaming/shared'
import { prisma } from '../lib/prisma.js'
export async function honorProgress(userId:number, tx:Prisma.TransactionClient=prisma):Promise<HonorProgress> {
  const [games,events,bonuses,settings]=await Promise.all([
    tx.userGame.aggregate({where:{userId},_sum:{score:true}}),
    tx.eventAward.aggregate({where:{userId},_sum:{points:true}}),
    tx.pointBonus.aggregate({where:{userId},_sum:{points:true}}),
    tx.siteSettings.findUnique({where:{id:1}}),
  ])
  const tiers=HonorTiersSchema.parse(settings?.honorTiers??[]).sort((a,b)=>a.points-b.points)
  const totalPoints=roundScore((games._sum.score??0)+(events._sum.points??0)+(bonuses._sum.points??0))
  const current=tiers.filter(t=>t.points<=totalPoints).at(-1)??null, next=tiers.find(t=>t.points>totalPoints)??null
  return {totalPoints,current,next,remaining:next?roundScore(next.points-totalPoints):0}
}
