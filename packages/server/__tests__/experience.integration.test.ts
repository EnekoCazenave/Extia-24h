import {beforeAll,afterAll,describe,it,expect,vi} from 'vitest'
import ExcelJS from 'exceljs'
import {prisma} from '../src/lib/prisma.js'
import {submitPlay} from '../src/services/play.service.js'
import {rejectSession} from '../src/services/moderation.service.js'
import {honorProgress} from '../src/services/honor.service.js'
import {reportingData,exportWorkbook} from '../src/services/reporting.service.js'
import {dispatchReminders} from '../src/services/notification-dispatch.service.js'
import {PlayInputSchema,SettingsSchema} from '@extia-gaming/shared'
import {buildApp} from '../src/app.js'

describe('Accueil, paliers, notifications et rapport',()=>{
  let userId:number,otherId:number,groupId:number,gameId:number,modeId:number,eventId:number
  const prefix=`experience-${Date.now()}`
  beforeAll(async()=>{
    groupId=(await prisma.organizationGroup.create({data:{name:prefix,kind:'AGENCY'}})).id
    for(let i=0;i<2;i++){
      const u=await prisma.user.create({data:{email:`${prefix}-${i}@example.invalid`,login:i?'Second':'=1+2',firstname:'Test',lastname:'Export',password:'not-exportable',roleId:1,groupId}})
      if(i)otherId=u.id;else userId=u.id
    }
    gameId=(await prisma.videoGame.create({data:{nom:prefix}})).id
    modeId=(await prisma.gameType.create({data:{name:prefix,videoGameId:gameId,calculType:'BOOLEAN',calculConfig:{type:'BOOLEAN',trueValue:10,falseValue:2},win:'Victoire',team:true}})).id
    eventId=(await prisma.event.create({data:{name:prefix,description:'Rappel de test',startsAt:new Date(Date.now()+5*60000),endsAt:new Date(Date.now()+60*60000),maxPlaces:10,pointsEarned:10,notifyPush:false,notifyEmail:true,notifyDiscord:true,userEvents:{create:[{userId},{userId:otherId}]}}})).id
    await prisma.siteSettings.upsert({where:{id:1},create:{id:1,honorTiers:[{name:'Bronze',points:10},{name:'Argent',points:50}]},update:{honorTiers:[{name:'Bronze',points:10},{name:'Argent',points:50}]}})
  })
  afterAll(async()=>{
    await prisma.userGame.deleteMany({where:{gameTypeId:modeId}})
    await prisma.gameSessionMember.deleteMany({where:{session:{gameTypeId:modeId}}})
    await prisma.gameSession.deleteMany({where:{gameTypeId:modeId}})
    await prisma.gameType.delete({where:{id:modeId}});await prisma.videoGame.delete({where:{id:gameId}})
    await prisma.pointBonus.deleteMany({where:{userId:{in:[userId,otherId]}}})
    await prisma.event.delete({where:{id:eventId}})
    await prisma.user.deleteMany({where:{id:{in:[userId,otherId]}}})
    await prisma.groupPoint.deleteMany({where:{groupId}});await prisma.organizationGroup.delete({where:{id:groupId}})
    await prisma.$disconnect()
  })
  it('crédite automatiquement toute l’équipe et retire les points en cas de rejet concurrent',async()=>{
    const session=await submitPlay(userId,PlayInputSchema.parse({gameTypeId:modeId,calculType:'BOOLEAN',value:true,teamMemberIds:[otherId]}))
    expect(session.status).toBe('APPROVED');expect(session.honor.current?.name).toBe('Bronze');expect(session.honor.remaining).toBe(40)
    expect(await prisma.userGame.count({where:{gameSessionId:session.id}})).toBe(2)
    const r=await Promise.allSettled([rejectSession(session.id),rejectSession(session.id)])
    expect(r.filter(x=>x.status==='fulfilled')).toHaveLength(1)
    expect(await prisma.userGame.count({where:{gameSessionId:session.id}})).toBe(0)
    expect((await honorProgress(userId)).current).toBeNull()
    expect((await honorProgress(otherId)).totalPoints).toBe(0)
  })
  it('n’envoie aucun rappel sans configuration puis un email par inscrit et un seul message Discord',async()=>{
    const sender={push:vi.fn(),email:vi.fn(),discord:vi.fn()}
    await dispatchReminders(sender,new Date(),{publicKey:null})
    expect(sender.email).not.toHaveBeenCalled();expect(sender.discord).not.toHaveBeenCalled()
    const config={publicKey:null,emailReady:true,discordReady:true}
    await Promise.all([dispatchReminders(sender,new Date(),config),dispatchReminders(sender,new Date(),config)])
    expect(sender.email).toHaveBeenCalledTimes(2);expect(sender.discord).toHaveBeenCalledTimes(1);expect(sender.push).not.toHaveBeenCalled()
    await dispatchReminders(sender,new Date(),config)
    expect(sender.email).toHaveBeenCalledTimes(2)
  })
  it('respecte les canaux désactivés et la fenêtre de dix minutes',async()=>{
    const sender={push:vi.fn(),email:vi.fn(),discord:vi.fn()},config={publicKey:null,emailReady:true,discordReady:true}
    await prisma.eventChannelDelivery.deleteMany({where:{eventId}})
    await prisma.event.update({where:{id:eventId},data:{startsAt:new Date(Date.now()+11*60000)}})
    await dispatchReminders(sender,new Date(),config);expect(sender.email).not.toHaveBeenCalled()
    await prisma.event.update({where:{id:eventId},data:{startsAt:new Date(Date.now()+5*60000),notifyEmail:false,notifyDiscord:false}})
    await dispatchReminders(sender,new Date(),config);expect(sender.email).not.toHaveBeenCalled();expect(sender.discord).not.toHaveBeenCalled()
  })
  it('réconcilie le classeur avec les points, groupes et affiliations sans exposer les secrets',async()=>{
    await submitPlay(userId,PlayInputSchema.parse({gameTypeId:modeId,calculType:'BOOLEAN',value:true}))
    await prisma.pointBonus.create({data:{userId,grantedById:otherId,points:3,reason:'Fair-play'}})
    await prisma.groupPoint.create({data:{groupId,grantedById:otherId,points:7,reason:'Collectif'}})
    const report=await reportingData(),person=report.participants.find(u=>u.id===userId),group=report.groups.find(g=>g.id===groupId)
    expect(person?.totalPoints).toBe(13);expect(group?.totalPoints).toBe(20);expect(group?.members).toBe(2)
    const wb=new ExcelJS.Workbook();await wb.xlsx.load(await exportWorkbook())
    expect(wb.worksheets).toHaveLength(10)
    const sheet=wb.getWorksheet('Participants')!
    expect(sheet.autoFilter).toBeDefined();expect(sheet.views[0].state).toBe('frozen')
    const row=sheet.getRows(2,sheet.rowCount-1)!.find(r=>r.getCell(2).value===userId)!
    expect(row.getCell(3).value).toBe('=1+2');expect(row.getCell(3).type).toBe(ExcelJS.ValueType.String)
    expect(JSON.stringify(wb.model)).not.toContain('not-exportable')
    const totals=report.sheets.find(s=>s.name==='Points')!.rows.reduce((sum,r)=>sum+Number(r[10]),0)
    expect(totals).toBeCloseTo(report.kpis.totalPoints,6)
  })
  it('protège le rapport et valide les paliers et le lien Discord',async()=>{
    const app=await buildApp({logger:false});await app.ready()
    expect((await app.inject({url:'/api/admin/report.xlsx'})).statusCode).toBe(401)
    const cookie=`access_token=${app.jwt.sign({sub:userId,roleId:1,email:'test@example.invalid'})}`
    expect((await app.inject({url:'/api/admin/kpis',headers:{cookie}})).statusCode).toBe(403)
    expect(SettingsSchema.safeParse({eventStart:null,eventEnd:null,honorTiers:[{name:'A',points:10},{name:'B',points:10}]}).success).toBe(false)
    expect(SettingsSchema.safeParse({eventStart:null,eventEnd:null,discordUrl:'javascript:alert(1)'}).success).toBe(false)
    await app.close()
  })
})
