import ExcelJS from 'exceljs'
import { Prisma } from '@prisma/client'
import { roundScore, HonorTiersSchema } from '@extia-gaming/shared'
import { prisma } from '../lib/prisma.js'

type Cell=string|number|boolean|Date|null
interface Sheet {name:string;columns:string[];rows:Cell[][]}
export async function reportingData() {
  return prisma.$transaction(async tx=>{
    const [users,groups,sessionRows,credits,bonuses,awards,groupPoints,eventRows,registrations,games,types,settings]=await Promise.all([
      tx.user.findMany({where:{statisticsConsent:true},select:{id:true,login:true,groupId:true},orderBy:{id:'asc'}}),
      tx.organizationGroup.findMany({orderBy:{id:'asc'}}),
      tx.gameSession.findMany({where:{OR:[{submitter:{statisticsConsent:true}},{teamMembers:{some:{user:{statisticsConsent:true}}}}]},include:{submitter:{select:{statisticsConsent:true}},teamMembers:{where:{user:{statisticsConsent:true}},select:{userId:true}}},orderBy:{id:'asc'}}),
      tx.userGame.findMany({where:{user:{statisticsConsent:true}},orderBy:{id:'asc'}}),tx.pointBonus.findMany({where:{user:{statisticsConsent:true}},orderBy:{id:'asc'}}),tx.eventAward.findMany({where:{user:{statisticsConsent:true}},orderBy:{id:'asc'}}),tx.groupPoint.findMany({orderBy:{id:'asc'}}),
      tx.event.findMany({orderBy:{startsAt:'asc'}}),tx.userEvent.findMany({where:{user:{statisticsConsent:true}},orderBy:[{eventId:'asc'},{userId:'asc'}]}),
      tx.videoGame.findMany({orderBy:{id:'asc'}}),tx.gameType.findMany({orderBy:{id:'asc'}}),tx.siteSettings.findUnique({where:{id:1}}),
    ])
    // Shared sessions retain only consenting players; never expose another player's identity or proof.
    const consentingIds = new Set(users.map(user => user.id))
    const sessions = sessionRows.map(s => ({...s, submitterId: s.submitter.statisticsConsent ? s.submitterId : null, proofUrl: null}))
    const events = eventRows.map(e => ({...e, winnerId: e.winnerId !== null && consentingIds.has(e.winnerId) ? e.winnerId : null}))
    const sum=(values:number[])=>roundScore(values.reduce((a,b)=>a+b,0))
    const userById=new Map(users.map(u=>[u.id,u])), groupById=new Map(groups.map(g=>[g.id,g])), typeById=new Map(types.map(t=>[t.id,t])), gameById=new Map(games.map(g=>[g.id,g])), eventById=new Map(events.map(e=>[e.id,e]))
    const honor=HonorTiersSchema.parse(settings?.honorTiers??[]).sort((a,b)=>a.points-b.points)
    const participants=users.map(u=>{
      const gamePoints=sum(credits.filter(x=>x.userId===u.id).map(x=>x.score)),eventPoints=sum(awards.filter(x=>x.userId===u.id).map(x=>x.points)),bonusPoints=sum(bonuses.filter(x=>x.userId===u.id).map(x=>x.points))
      const plays=sessions.filter(s=>s.submitterId===u.id||s.teamMembers.some(m=>m.userId===u.id)),totalPoints=sum([gamePoints,eventPoints,bonusPoints])
      return {...u,group:groupById.get(u.groupId??0),gamePoints,eventPoints,bonusPoints,totalPoints,approved:plays.filter(s=>s.status==='APPROVED').length,pending:plays.filter(s=>s.status==='PENDING').length,rejected:plays.filter(s=>s.status==='REJECTED').length,legacy:credits.filter(x=>x.userId===u.id&&x.gameSessionId===null).length,registrations:registrations.filter(x=>x.userId===u.id).length,present:registrations.filter(x=>x.userId===u.id&&x.isPresent===true).length,honor:honor.filter(t=>t.points<=totalPoints).at(-1)?.name??''}
    }).sort((a,b)=>b.totalPoints-a.totalPoints||a.id-b.id)
    const groupRows=groups.map(g=>{
      const members=participants.filter(u=>u.groupId===g.id),playerPoints=sum(members.map(u=>u.totalPoints)),manualPoints=sum(groupPoints.filter(x=>x.groupId===g.id).map(x=>x.points))
      return {...g,members:members.length,activePlayers:members.filter(u=>u.approved+u.legacy>0).length,playerPoints,manualPoints,totalPoints:sum([playerPoints,manualPoints])}
    })
    const individualPoints=sum(participants.map(u=>u.totalPoints)),manualGroupPoints=sum(groupPoints.map(x=>x.points))
    const kpis={participants:users.length,activePlayers:participants.filter(u=>u.approved+u.legacy>0).length,groups:groups.length,sessions:sessions.length,approved:sessions.filter(s=>s.status==='APPROVED').length,pending:sessions.filter(s=>s.status==='PENDING').length,rejected:sessions.filter(s=>s.status==='REJECTED').length,totalPoints:sum([individualPoints,manualGroupPoints]),individualPoints,manualGroupPoints,registrations:registrations.length,present:registrations.filter(r=>r.isPresent===true).length}
    const userColumns=['Utilisateur ID','Pseudo','Groupe ID','Groupe','Catégorie']
    const identity=(id:number):Cell[]=>{const u=userById.get(id),g=groupById.get(u?.groupId??0);return [id,u?.login??'',g?.id??null,g?.name??'Sans groupe',g?.kind??'']}
    const pointRows:Cell[][]=[
      ...credits.map(c=>{const t=typeById.get(c.gameTypeId);return ['Partie',c.id,...identity(c.userId),c.gameSessionId,t?.name??'',gameById.get(t?.videoGameId??0)?.nom??'',c.score,c.playedAt,'']}),
      ...awards.map(a=>['Événement',a.id,...identity(a.userId),a.eventId,eventById.get(a.eventId)?.name??'','',a.points,a.createdAt,'']),
      ...bonuses.map(b=>['Bonus individuel',b.id,...identity(b.userId),null,'','',b.points,b.createdAt,'']),
      ...groupPoints.map(g=>['Bonus groupe',g.id,null,'',g.groupId,groupById.get(g.groupId)?.name??'',groupById.get(g.groupId)?.kind??'',null,'','',g.points,g.createdAt,'']),
    ]
    const sheets:Sheet[]=[
      {name:'Synthèse',columns:['Indicateur','Valeur'],rows:[['Export du (UTC)',new Date()],['Participants',kpis.participants],['Joueurs actifs',kpis.activePlayers],['Groupes',kpis.groups],['Parties déclarées',kpis.sessions],['Parties validées',kpis.approved],['Parties en attente',kpis.pending],['Parties refusées',kpis.rejected],['Points individuels',individualPoints],['Bonus des groupes',manualGroupPoints],['Total général',kpis.totalPoints],['Inscriptions aux événements',kpis.registrations],['Présences confirmées',kpis.present],['Périmètre','Participants ayant consenti aux statistiques uniquement ; retrait pris en compte au prochain calcul. Les bonus collectifs sans donnée individuelle sont inclus séparément.'],['Affiliation','Groupe actuel de chaque utilisateur ; non historisé à la date de la partie.'],['Lecture','Filtrer les en-têtes des feuilles. Parties contient une ligne par participant et session.'],['Comptage','Un crédit ancien sans session est indiqué séparément. Les bonus de groupe ne sont pas répartis entre les joueurs.'],['Horaires','Toutes les dates du classeur sont en UTC.']]},
      {name:'Participants',columns:['Rang',...userColumns,'Parties validées','Parties en attente','Parties refusées','Parties anciennes','Points parties','Points événements','Bonus individuels','Total points','Inscriptions','Présences','Palier'],rows:participants.map((u,i)=>[i+1,...identity(u.id),u.approved,u.pending,u.rejected,u.legacy,u.gamePoints,u.eventPoints,u.bonusPoints,u.totalPoints,u.registrations,u.present,u.honor])},
      {name:'Groupes',columns:['ID','Groupe','Catégorie','Actif','Membres','Joueurs actifs','Points des membres','Bonus du groupe','Total points','Moyenne par membre'],rows:groupRows.map(g=>[g.id,g.name,g.kind,g.active,g.members,g.activePlayers,g.playerPoints,g.manualPoints,g.totalPoints,g.members?roundScore(g.playerPoints/g.members):0])},
      {name:'Parties',columns:['Partie ID',...userColumns,'Déclarant ID','Jeu','Type ID','Type de partie','Statut','Score calculé du groupe','Points crédités au joueur','Déclaration UTC','Modération UTC'],rows:sessions.flatMap(s=>[s.submitterId,...s.teamMembers.map(m=>m.userId)].filter((uid):uid is number=>uid!==null).map(uid=>{const t=typeById.get(s.gameTypeId);return [s.id,...identity(uid),s.submitterId,gameById.get(t?.videoGameId??0)?.nom??'',s.gameTypeId,t?.name??'',s.status,s.score,sum(credits.filter(c=>c.gameSessionId===s.id&&c.userId===uid).map(c=>c.score)),s.createdAt,s.reviewedAt]}))},
      {name:'Points',columns:['Source','Crédit ID',...userColumns,'Référence ID','Type ou événement','Jeu','Points','Date UTC','Motif'],rows:pointRows},
      {name:'Événements',columns:['ID','Événement','Début UTC','Fin UTC','Jeu','Capacité','Inscrits','Présents','Taux de remplissage','Points par présence','Part gagnant','Gagnant ID','Points distribués','Clôture UTC','Rappel push','Rappel email','Rappel Discord'],rows:events.map(e=>[e.id,e.name,e.startsAt,e.endsAt,gameById.get(e.videoGameId??0)?.nom??'',e.maxPlaces,registrations.filter(r=>r.eventId===e.id).length,registrations.filter(r=>r.eventId===e.id&&r.isPresent===true).length,registrations.filter(r=>r.eventId===e.id).length/e.maxPlaces,e.pointsEarned,e.winnerShare,e.winnerId,sum(awards.filter(a=>a.eventId===e.id).map(a=>a.points)),e.settledAt,e.notifyPush,e.notifyEmail,e.notifyDiscord])},
      {name:'Inscriptions',columns:['Événement ID','Événement',...userColumns,'Inscription UTC','Présence','Points événement'],rows:registrations.map(r=>[r.eventId,eventById.get(r.eventId)?.name??'',...identity(r.userId),r.registeredAt,r.isPresent===null?'Non confirmée':r.isPresent?'Présent':'Absent',sum(awards.filter(a=>a.eventId===r.eventId&&a.userId===r.userId).map(a=>a.points))])},
      {name:'Jeux',columns:['ID','Jeu','Nombre de modes','Parties validées','Participants uniques','Points parties','Points événements','Total points'],rows:games.map(g=>{const ids=types.filter(t=>t.videoGameId===g.id).map(t=>t.id),c=credits.filter(c=>ids.includes(c.gameTypeId)),gp=sum(c.map(c=>c.score)),ep=sum(awards.filter(a=>eventById.get(a.eventId)?.videoGameId===g.id).map(a=>a.points));return [g.id,g.nom,ids.length,sessions.filter(s=>ids.includes(s.gameTypeId)&&s.status==='APPROVED').length,new Set(c.map(c=>c.userId)).size,gp,ep,sum([gp,ep])]})},
      {name:'Types de partie',columns:['ID','Type','Jeu','Calcul','Équipe','Maximum parties','Maximum points','Condition de victoire','Configuration JSON'],rows:types.map(t=>[t.id,t.name,gameById.get(t.videoGameId)?.nom??'',t.calculType,t.team,t.maxPlaysPerUser,t.maxPointsPerUser,t.win,JSON.stringify(t.calculConfig)])},
      {name:'Paliers',columns:['Palier','Seuil'],rows:honor.map(t=>[t.name,t.points])},
    ]
    return {kpis,sheets,participants,groups:groupRows}
  },{isolationLevel:Prisma.TransactionIsolationLevel.RepeatableRead,timeout:30000})
}
export async function exportWorkbook() {
  const data=await reportingData(),workbook=new ExcelJS.Workbook()
  workbook.creator='Extia Gaming';workbook.created=new Date()
  for(const [index,source] of data.sheets.entries()) {
    if(source.rows.length>1048575)throw new Error('Trop de lignes pour une feuille Excel')
    if(source.rows.some(row=>row.some(c=>typeof c==='string'&&c.length>32767)))throw new Error('Une cellule dépasse la capacité Excel')
    const ws=workbook.addWorksheet(source.name,{views:[{state:'frozen',ySplit:1}]})
    ws.addTable({name:`Export${index+1}`,ref:'A1',headerRow:true,style:{theme:'TableStyleMedium2',showRowStripes:true},columns:source.columns.map(name=>({name,filterButton:true})),rows:source.rows})
    ws.columns.forEach((col,i)=>{col.width=Math.min(48,Math.max(16,source.columns[i].length+2));col.numFmt='0.######'})
    ws.eachRow((row,n)=>{if(n===1){row.font={bold:true,color:{argb:'FFFFFFFF'}};row.height=30}else row.eachCell(cell=>{if(cell.value instanceof Date)cell.numFmt='dd/mm/yyyy hh:mm';cell.alignment={vertical:'top',wrapText:true}})})
    ws.autoFilter={from:{row:1,column:1},to:{row:Math.max(1,source.rows.length+1),column:source.columns.length}}
  }
  return Buffer.from(await workbook.xlsx.writeBuffer())
}
