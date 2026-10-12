import { beforeAll,beforeEach,afterAll,describe,it,expect,vi } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildApp } from '../src/app.js'
import { prisma } from '../src/lib/prisma.js'
import {createEvent,registerToEvent,confirmEventAttendance,unregisterToEvent,updateEvent,deleteEvent} from '../src/services/event.service.js'
import {settleEvent} from '../src/services/event-scoring.service.js'
const registerEvent=(eventId:number,userId:number)=>registerToEvent(userId,eventId)
const confirmAttendance=(eventId:number,userId:number,_actor?:number)=>confirmEventAttendance(userId,eventId,true)
const removeRegistration=(eventId:number,userId:number)=>unregisterToEvent(userId,eventId)
const cancelEvent=deleteEvent
import { CreateEventSchema } from '@extia-gaming/shared'
import {dispatchReminders} from '../src/services/notification-dispatch.service.js'
import {CreateSubscriptionNotificationSchema as PushInputSchema} from '@extia-gaming/shared'
import { getGlobalLeaderboard,getFilteredLeaderboard } from '../src/services/leaderboard.service.js'
import { playerSummary,publicSettings,toCsv } from '../src/services/community.service.js'

describe('Plateforme événementielle',()=>{
  let app:FastifyInstance,users:number[]=[],cookie:string,adminCookie:string
  const prefix=`platform-${Date.now()}-`
  beforeAll(async()=>{
    app=await buildApp({logger:false});await app.ready()
    for(let i=0;i<3;i++)users.push((await prisma.user.create({data:{login:`${prefix}${i}`,email:`${prefix}${i}@event.invalid`,password:'test-only',firstname:'Test',lastname:'Event',roleId:i===2?2:1}})).id)
    cookie=`access_token=${app.jwt.sign({sub:users[0],roleId:1,email:'player@event.invalid'})}`
    adminCookie=`access_token=${app.jwt.sign({sub:users[2],roleId:2,email:'admin@event.invalid'})}`
  })
  async function clear() {
    await prisma.eventAward.deleteMany({where:{event:{name:{startsWith:prefix}}}})
    await prisma.event.deleteMany({where:{name:{startsWith:prefix}}})
    await prisma.subscriptionNotification.deleteMany({where:{userId:{in:users}}})
  }
  beforeEach(clear)
  afterAll(async()=>{
    await clear()
    await prisma.user.deleteMany({where:{id:{in:users}}})
    await prisma.groupPoint.deleteMany({where:{group:{name:{startsWith:prefix}}}})
    await prisma.organizationGroup.deleteMany({where:{name:{startsWith:prefix}}})
    await prisma.projectTask.deleteMany({where:{title:{startsWith:prefix}}})
    await app.close();await prisma.$disconnect()
  })
  async function event(start=-60000,end=60000,capacity=5) {
    return createEvent(CreateEventSchema.parse({name:prefix+'Quiz',description:'Test',startsAt:new Date(Date.now()+start).toISOString(),endsAt:new Date(Date.now()+end).toISOString(),maxPlaces:capacity,pointsEarned:10,winnerShare:0.05}))
  }
  async function ended(id:number){await prisma.event.update({where:{id},data:{endsAt:new Date(Date.now()-1)}})}
  it('accepte une inscription tardive mais pas après la fin',async()=>{
    const e=await event();await registerEvent(e.id,users[0]);await ended(e.id)
    await expect(registerEvent(e.id,users[1])).rejects.toThrow('EVENT_ENDED')
  })
  it('ne dépasse pas la capacité en concurrence et refuse une réinscription',async()=>{
    const e=await event(-60000,60000,1)
    const results=await Promise.allSettled([registerEvent(e.id,users[0]),registerEvent(e.id,users[1])])
    expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1)
    const row=await prisma.userEvent.findFirstOrThrow({where:{eventId:e.id}})
    await expect(registerEvent(e.id,row.userId)).rejects.toThrow('ALREADY_REGISTERED');expect(await prisma.userEvent.count({where:{eventId:e.id}})).toBe(1)
  })
  it('exige une inscription et une confirmation dans la fenêtre de présence',async()=>{
    const future=await event(60000,120000);await registerEvent(future.id,users[0])
    await expect(confirmAttendance(future.id,users[0],users[0])).rejects.toThrow('ATTENDANCE_UNAVAILABLE')
    const live=await event();await expect(confirmAttendance(live.id,users[0],users[0])).rejects.toThrow('ATTENDANCE_UNAVAILABLE')
    await registerEvent(live.id,users[0]);await confirmAttendance(live.id,users[0],users[0]);await expect(confirmAttendance(live.id,users[0],users[2])).rejects.toThrow('ATTENDANCE_UNAVAILABLE')
    await ended(live.id);await expect(confirmAttendance(live.id,users[0],users[0])).rejects.toThrow('ATTENDANCE_UNAVAILABLE')
  })
  it('crédite uniquement les présents, partage 95/5 et résiste à une double distribution',async()=>{
    const e=await event();for(const user of users)await registerEvent(e.id,user)
    await confirmAttendance(e.id,users[0],users[0]);await confirmAttendance(e.id,users[1],users[2]);await ended(e.id)
    const result=await Promise.allSettled([settleEvent(e.id,users[1]),settleEvent(e.id,users[1])]);expect(result.filter(r=>r.status==='fulfilled')).toHaveLength(1)
    const awards=await prisma.eventAward.findMany({where:{eventId:e.id},orderBy:{userId:'asc'}});expect(awards.map(a=>a.points)).toEqual([9.5,10.5])
    expect((await playerSummary(users[0],true))?.eventPoints).toBe(9.5)
    expect((await getGlobalLeaderboard(1000)).find(r=>r.userId===users[1])?.totalScore).toBe(10.5)
    expect((await getFilteredLeaderboard({team:true})).find(r=>r.userId===users[0])?.totalScore).toBe(9.5)
    await expect(removeRegistration(e.id,users[0])).rejects.toThrow('récompensé')
  })
  it('refuse un vainqueur absent et les événements annulés',async()=>{
    const e=await event();await registerEvent(e.id,users[0]);await confirmAttendance(e.id,users[0],users[0]);await ended(e.id)
    await expect(settleEvent(e.id,users[1])).rejects.toThrow('présents')
    const cancelled=await event();await cancelEvent(cancelled.id)
    await expect(registerEvent(cancelled.id,users[0])).rejects.toThrow('EVENT_NOT_FOUND')
  })
  it('protège les routes administratives, les participants et les exports',async()=>{
    for(const url of ['/api/admin/exports/participants','/api/admin/tasks']) {
      expect((await app.inject({url})).statusCode).toBe(401)
      expect((await app.inject({url,headers:{cookie}})).statusCode).toBe(403)
    }
    const body={name:prefix+'API',description:'Test',pointsEarned:10,startsAt:new Date(Date.now()+60000).toISOString(),endsAt:new Date(Date.now()+120000).toISOString(),maxPlaces:10}
    const created=await app.inject({method:'POST',url:'/api/admin/events',headers:{cookie:adminCookie},payload:body});expect(created.statusCode).toBe(201)
    const id=created.json().event.id
    expect((await app.inject({method:'POST',url:`/api/events/${id}/participation`,headers:{cookie}})).statusCode).toBe(201)
    const list=await app.inject({url:'/api/events'});expect(list.body).not.toContain('@event.invalid');expect(list.body).not.toContain('password')
  })
  it('attribue des points à une agence sans créer de joueur et exporte sans secrets',async()=>{
    const response=await app.inject({method:'POST',url:'/api/admin/groups',headers:{cookie:adminCookie},payload:{name:prefix+'Agence',kind:'AGENCY'}});expect(response.statusCode).toBe(200)
    const groupId=response.json().group.id,previous=(await publicSettings()).totalPoints
    expect((await app.inject({method:'POST',url:`/api/admin/groups/${groupId}/points`,headers:{cookie:adminCookie},payload:{points:50,reason:'Before'}})).statusCode).toBe(200)
    expect((await publicSettings()).totalPoints).toBe(previous+50)
    const csv=await app.inject({url:'/api/admin/exports/points',headers:{cookie:adminCookie}});expect(csv.statusCode).toBe(200);expect(csv.headers['content-type']).toContain('text/csv');expect(csv.body).toContain('groupe');expect(csv.body).not.toContain('test-only')
    expect(toCsv([{name:'=HYPERLINK("x")'}],['name'])).toContain("'=HYPERLINK")
  })
  it('retire un inscrit via la route administrateur et refuse la présence hors horaires',async()=>{
    const e=await event(60000,120000);await registerEvent(e.id,users[0])
    await expect(updateEvent(e.id,{attendance:{userId:users[0],isPresent:true}})).rejects.toThrow('ATTENDANCE_UNAVAILABLE')
    const url=`/api/admin/events/${e.id}/participants/${users[0]}`
    expect((await app.inject({method:'DELETE',url,headers:{cookie}})).statusCode).toBe(403)
    expect((await app.inject({method:'DELETE',url,headers:{cookie:adminCookie}})).statusCode).toBe(200)
    expect(await prisma.userEvent.count({where:{eventId:e.id}})).toBe(0)
  })
  it('persiste le Kanban et valide les horaires / paramètres',async()=>{
    expect(CreateEventSchema.safeParse({name:'Bad',startsAt:'2026-10-05T12:00:00Z',endsAt:'2026-10-05T11:00:00Z',capacity:1}).success).toBe(false)
    const created=await app.inject({method:'POST',url:'/api/admin/tasks',headers:{cookie:adminCookie},payload:{title:prefix+'Tâche'}}),task=created.json().task
    expect(created.statusCode).toBe(200)
    const changed=await app.inject({method:'PUT',url:`/api/admin/tasks/${task.id}`,headers:{cookie:adminCookie},payload:{...task,status:'DONE'}});expect(changed.json().task.status).toBe('DONE')
  })
  it('envoie des rappels seulement après consentement et sans répétition',async()=>{
    const e=await event(5*60000,60*60000);await registerEvent(e.id,users[0]);await registerEvent(e.id,users[1])
    await prisma.subscriptionNotification.create({data:{userId:users[0],endpoint:'https://fcm.googleapis.com/test',p256dh:'a'.repeat(87),auth:'a'.repeat(22)}})
    const sender={push:vi.fn().mockResolvedValue(undefined)},cfg={publicKey:'test-key'}
    await Promise.all([dispatchReminders(sender,new Date(),cfg),dispatchReminders(sender,new Date(),cfg)])
    expect(sender.push).toHaveBeenCalledTimes(1)
    await dispatchReminders(sender,new Date(),cfg)
  })
  it('retire les abonnements expirés et bloque les endpoints internes',async()=>{
    const e=await event(60000,600000);await registerEvent(e.id,users[0])
    await prisma.subscriptionNotification.create({data:{userId:users[0],endpoint:'https://fcm.googleapis.com/expired',p256dh:'a'.repeat(87),auth:'a'.repeat(22)}})
    await dispatchReminders({push:vi.fn().mockRejectedValue({statusCode:410})},new Date(),{publicKey:'test'})
    expect(await prisma.subscriptionNotification.count({where:{userId:users[0]}})).toBe(0)
    expect(PushInputSchema.safeParse({endpoint:'https://127.0.0.1/private',keys:{p256dh:'a'.repeat(87),auth:'a'.repeat(22)}}).success).toBe(false)
  })
})
