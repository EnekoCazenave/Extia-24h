import { prisma } from '../lib/prisma.js'
import { Prisma } from '@prisma/client'
import { roundScore } from '@extia-gaming/shared'

export async function playerSummary(userId:number, privateView=false) {
  const user=await prisma.user.findUnique({where:{id:userId},select:{id:true,login:true,group:{select:{id:true,name:true}}}})
  if(!user) return null
  const [games,bonuses,events,sessions,ranking]=await Promise.all([
    prisma.userGame.findMany({where:{userId},include:{gameType:{include:{videoGame:true}}},orderBy:{playedAt:'desc'}}),
    prisma.pointBonus.findMany({where:{userId},orderBy:{createdAt:'desc'},select:{id:true,points:true,reason:true,createdAt:true}}),
    prisma.eventAward.findMany({where:{userId},include:{event:{select:{id:true,name:true}}},orderBy:{createdAt:'desc'}}),
    privateView ? prisma.gameSession.findMany({where:{OR:[{submitterId:userId},{teamMembers:{some:{userId}}}]},include:{gameType:{include:{videoGame:true}},userGames:{where:{userId},select:{score:true}}},orderBy:{createdAt:'desc'}}) : Promise.resolve([]),
    prisma.$queryRaw<Array<{rank:bigint}>>(Prisma.sql`WITH totals AS (
      SELECT u.id, COALESCE((SELECT SUM(score) FROM "UserGame" WHERE "userId"=u.id),0)+COALESCE((SELECT SUM(points) FROM "PointBonus" WHERE "userId"=u.id),0)+COALESCE((SELECT SUM(points) FROM "EventAward" WHERE "userId"=u.id),0) AS points FROM "User" u
    ), ranks AS (SELECT id,ROW_NUMBER() OVER (ORDER BY points DESC,id ASC) AS rank FROM totals) SELECT rank FROM ranks WHERE id=${userId}`),
  ])
  const gamePoints=roundScore(games.reduce((s,r)=>s+r.score,0)),bonusPoints=bonuses.reduce((s,r)=>s+r.points,0),eventPoints=roundScore(events.reduce((s,r)=>s+r.points,0))
  return {user,rank:Number(ranking[0]?.rank??0),gamePoints,bonusPoints,eventPoints,totalPoints:roundScore(gamePoints+bonusPoints+eventPoints),games,bonuses:privateView?bonuses:bonuses.map(({reason,...row})=>row),events,sessions}
}

export async function listGroups() {
  const rows=await prisma.$queryRaw<Array<{id:number;name:string;kind:string;active:boolean;manualPoints:number;playerPoints:number;members:bigint}>>(Prisma.sql`
    SELECT g.*, COALESCE((SELECT SUM(points) FROM "GroupPoint" WHERE "groupId"=g.id),0) AS "manualPoints",
    COALESCE((SELECT SUM(score) FROM "UserGame" ug JOIN "User" u ON u.id=ug."userId" WHERE u."groupId"=g.id),0)+
    COALESCE((SELECT SUM(points) FROM "EventAward" ea JOIN "User" u ON u.id=ea."userId" WHERE u."groupId"=g.id),0)+
    COALESCE((SELECT SUM(points) FROM "PointBonus" pb JOIN "User" u ON u.id=pb."userId" WHERE u."groupId"=g.id),0) AS "playerPoints",
    (SELECT COUNT(*) FROM "User" u WHERE u."groupId"=g.id) AS members FROM "OrganizationGroup" g ORDER BY g.name`)
  return rows.map(r=>({...r,members:Number(r.members),totalPoints:roundScore(Number(r.manualPoints)+Number(r.playerPoints))}))
}
export async function publicSettings() {
  const settings=await prisma.siteSettings.findUnique({where:{id:1}}) ?? {eventStart:null,eventEnd:null}
  const [game,event,bonus,group]=await Promise.all([prisma.userGame.aggregate({_sum:{score:true}}),prisma.eventAward.aggregate({_sum:{points:true}}),prisma.pointBonus.aggregate({_sum:{points:true}}),prisma.groupPoint.aggregate({_sum:{points:true}})])
  const totalPoints=roundScore((game._sum.score??0)+(event._sum.points??0)+(bonus._sum.points??0)+(group._sum.points??0))
  return {...settings,totalPoints}
}

export function csvCell(value:unknown):string {
  let s=value instanceof Date?value.toISOString():value==null?'':String(value)
  if(/^[\s]*[=+\-@]/.test(s)) s="'"+s
  return '"'+s.replace(/"/g,'""')+'"'
}
export function toCsv(rows:Record<string,unknown>[],columns:string[]):string {
  return '\uFEFF'+[columns.map(csvCell).join(';'),...rows.map(row=>columns.map(c=>csvCell(row[c])).join(';'))].join('\r\n')
}
export async function exportData(kind:string) {
  switch(kind) {
    case 'participants': {
      const rows=await prisma.user.findMany({select:{id:true,login:true,firstname:true,lastname:true,email:true,intern:true,group:{select:{name:true,kind:true}}},orderBy:{id:'asc'}})
      return toCsv(rows.map(({group,...r})=>({...r,group:group?.name,groupKind:group?.kind})),['id','login','firstname','lastname','email','intern','group','groupKind'])
    }
    case 'presences': {
      const rows=await prisma.userEvent.findMany({include:{user:{select:{login:true}},event:{select:{name:true}}},orderBy:[{eventId:'asc'},{userId:'asc'}]})
      return toCsv(rows.map(r=>({eventId:r.eventId,event:r.event.name,userId:r.userId,login:r.user.login,registeredAt:r.registeredAt,isPresent:r.isPresent})),['eventId','event','userId','login','registeredAt','isPresent'])
    }
    case 'parties': {
      const rows=await prisma.gameSession.findMany({include:{gameType:{select:{name:true}},teamMembers:{select:{userId:true}}},orderBy:{id:'asc'}})
      return toCsv(rows.map(r=>({id:r.id,submitterId:r.submitterId,participants:[r.submitterId,...r.teamMembers.map(m=>m.userId)].join(','),mode:r.gameType.name,calculatedPoints:r.score,status:r.status,createdAt:r.createdAt,reviewedAt:r.reviewedAt})),['id','submitterId','participants','mode','calculatedPoints','status','createdAt','reviewedAt'])
    }
    case 'points': {
      const [games,events,bonuses,groups]=await Promise.all([prisma.userGame.findMany(),prisma.eventAward.findMany(),prisma.pointBonus.findMany(),prisma.groupPoint.findMany()])
      return toCsv([...games.map(r=>({source:'partie',id:r.id,userId:r.userId,groupId:null,reference:r.gameSessionId,points:r.score,date:r.playedAt})),...events.map(r=>({source:'evenement',id:r.id,userId:r.userId,groupId:null,reference:r.eventId,points:r.points,date:r.createdAt})),...bonuses.map(r=>({source:'bonus',id:r.id,userId:r.userId,groupId:null,reference:null,points:r.points,date:r.createdAt})),...groups.map(r=>({source:'groupe',id:r.id,userId:null,groupId:r.groupId,reference:null,points:r.points,date:r.createdAt}))],['source','id','userId','groupId','reference','points','date'])
    }
    case 'groupes': return toCsv(await listGroups(),['id','name','kind','active','members','manualPoints','playerPoints','totalPoints'])
    case 'evenements': {
      const rows=await prisma.event.findMany({include:{_count:{select:{userEvents:true,awards:true}}},orderBy:{id:'asc'}})
      return toCsv(rows.map(r=>({...r,registrations:r._count.userEvents,awards:r._count.awards})),['id','name','description','startsAt','endsAt','maxPlaces','videoGameId','twitchUrl','pointsEarned','winnerShare','winnerId','settledAt','registrations','awards'])
    }
    default: return null
  }
}
