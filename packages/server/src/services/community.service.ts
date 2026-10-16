import { prisma } from '../lib/prisma.js'
import { Prisma } from '@prisma/client'
import { roundScore } from '@extia-gaming/shared'
import { reportingData } from './reporting.service.js'

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
  // Operational totals include every participant, independently of optional statistics consent.
  const [participantCount,game,event,bonus,group]=await Promise.all([prisma.user.count(),prisma.userGame.aggregate({_sum:{score:true}}),prisma.eventAward.aggregate({_sum:{points:true}}),prisma.pointBonus.aggregate({_sum:{points:true}}),prisma.groupPoint.aggregate({_sum:{points:true}})])
  const gamePoints=roundScore(game._sum.score??0),eventPoints=roundScore(event._sum.points??0),bonusPoints=roundScore(bonus._sum.points??0),groupBonusPoints=roundScore(group._sum.points??0)
  const totalPoints=roundScore((game._sum.score??0)+(event._sum.points??0)+(bonus._sum.points??0)+(group._sum.points??0))
  return {...settings,participantCount,gamePoints,eventPoints,bonusPoints,groupBonusPoints,totalPoints}
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
  const sheetNames: Record<string,string> = { participants:'Participants', presences:'Inscriptions', parties:'Parties', points:'Points', groupes:'Groupes', evenements:'Événements' }
  if (!Object.hasOwn(sheetNames,kind)) return null
  const data = await reportingData()
  const sheet = data.sheets.find(sheet => sheet.name === sheetNames[kind])!
  return toCsv(sheet.rows.map(row => Object.fromEntries(sheet.columns.map((column,index) => [column,row[index]]))),sheet.columns)
}
