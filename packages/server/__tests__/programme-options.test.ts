import {beforeEach,describe,expect,it,vi} from 'vitest'
const db = vi.hoisted(()=>({event:{findUnique:vi.fn(),create:vi.fn(),update:vi.fn()},user:{findUnique:vi.fn()},userEvent:{findUnique:vi.fn(),create:vi.fn()},eventAward:{createMany:vi.fn()},$transaction:vi.fn()}))
vi.mock('../src/lib/prisma.js',()=>({prisma:db}))
import {createEvent,registerToEvent,updateEvent} from '../src/services/event.service.js'
import {settleEvent} from '../src/services/event-scoring.service.js'

describe('Programme participation and reward options',()=>{
 const event={name:'Animation libre',description:'Venez jouer',startsAt:new Date(Date.now()+60000).toISOString(),endsAt:new Date(Date.now()+120000).toISOString(),maxPlaces:20,pointsEarned:0,registrationRequired:false,awardsPoints:false}
 beforeEach(()=>{vi.resetAllMocks();db.$transaction.mockImplementation(work=>work(db))})
 it('creates a free event without points while preserving explicit options',async()=>{
  await createEvent(event)
  expect(db.event.create).toHaveBeenCalledWith({data:expect.objectContaining({registrationRequired:false,awardsPoints:false,pointsEarned:0})})
 })
 it('rejects points without registrations and zero-point rewarded events',async()=>{
  await expect(createEvent({...event,awardsPoints:true,pointsEarned:10})).rejects.toThrow('inscription')
  await expect(createEvent({...event,registrationRequired:true,awardsPoints:true})).rejects.toThrow('positif')
  expect(db.event.create).not.toHaveBeenCalled()
 })
 it('blocks registration and settlement at the API service layer for free events',async()=>{
  db.event.findUnique.mockResolvedValue({...event,id:3,_count:{userEvents:0},userEvents:[],endsAt:new Date(Date.now()-60000)})
  await expect(registerToEvent(1,3)).rejects.toThrow('sans inscription')
  await expect(settleEvent(3,null)).rejects.toThrow('ne distribue pas')
  expect(db.userEvent.create).not.toHaveBeenCalled()
  expect(db.eventAward.createMany).not.toHaveBeenCalled()
 })
 it('prevents removing registrations after users have joined',async()=>{
  db.event.findUnique.mockResolvedValue({...event,registrationRequired:true,startsAt:new Date(event.startsAt),endsAt:new Date(event.endsAt),_count:{userEvents:1}})
  await expect(updateEvent(3,{registrationRequired:false})).rejects.toThrow('déjà inscrits')
 })
 it('checks the merged state when a partial update turns rewards on',async()=>{
  db.event.findUnique.mockResolvedValue({...event,startsAt:new Date(event.startsAt),endsAt:new Date(event.endsAt),_count:{userEvents:0}})
  await expect(updateEvent(3,{awardsPoints:true,pointsEarned:10})).rejects.toThrow('inscription')
 })
})
