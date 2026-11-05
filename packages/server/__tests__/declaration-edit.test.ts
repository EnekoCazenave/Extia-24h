import {beforeEach,describe,expect,it,vi} from 'vitest'
const db = vi.hoisted(() => ({gameSession:{findUnique:vi.fn(),update:vi.fn()},gameSessionMember:{deleteMany:vi.fn()},gameType:{findUnique:vi.fn()},siteSettings:{findUnique:vi.fn()},userGame:{deleteMany:vi.fn()},$transaction:vi.fn()}))
const approve = vi.hoisted(() => vi.fn())
vi.mock('../src/lib/prisma.js',()=>({prisma:db}))
vi.mock('../src/services/moderation.service.js',()=>({approveSessionInTransaction:approve}))
vi.mock('../src/services/honor.service.js',()=>({honorProgress:vi.fn().mockResolvedValue({})}))
import {getEditableSession,submitPlay} from '../src/services/play.service.js'
import {PlayInputSchema} from '@extia-gaming/shared'

describe('Declaration corrections',()=>{
 const input=PlayInputSchema.parse({gameTypeId:3,calculType:'NUMBER',value:5})
 const original={id:7,submitterId:1,gameTypeId:3,status:'APPROVED',createdAt:new Date('2026-01-01'),scoringData:{version:2,config:{type:'NUMBER',multiplier:2},input,happyHourMultiplier:2},gameType:{videoGameId:9}}
 beforeEach(()=>{
  vi.resetAllMocks()
  db.$transaction.mockImplementation(work=>work(db))
  db.gameSession.findUnique.mockResolvedValue(original)
  db.siteSettings.findUnique.mockResolvedValue({proofRequired:false})
  db.gameType.findUnique.mockResolvedValue({id:3,calculType:'NUMBER',calculConfig:{type:'NUMBER',multiplier:100},team:false,videoGameId:9,videoGame:{}})
  db.gameSession.update.mockResolvedValue({id:7})
 })
 it('loads the original input only for its owner',async()=>{
  await expect(getEditableSession(1,7)).resolves.toMatchObject({id:7,gameId:9,input,calculConfig:{type:'NUMBER',multiplier:2},happyHourMultiplier:2})
  await expect(getEditableSession(2,7)).rejects.toMatchObject({statusCode:404})
 })
 it('refuses editing another declaration or changing its mode before removing credits',async()=>{
  await expect(submitPlay(2,input,7)).rejects.toMatchObject({statusCode:404})
  await expect(submitPlay(1,{...input,gameTypeId:4},7)).rejects.toMatchObject({statusCode:409})
  expect(db.userGame.deleteMany).not.toHaveBeenCalled()
 })
 it('replaces credits atomically while preserving original rules, date and happy hour',async()=>{
  await submitPlay(1,{...input,value:8} as typeof input,7)
  expect(db.userGame.deleteMany).toHaveBeenCalledWith({where:{gameSessionId:7}})
  expect(db.gameSession.update).toHaveBeenCalledWith(expect.objectContaining({data:expect.objectContaining({score:32,scoringData:expect.objectContaining({config:{type:'NUMBER',multiplier:2},happyHourMultiplier:2})})}))
  expect(db.gameSession.update.mock.calls[0][0].data).not.toHaveProperty('createdAt')
  expect(approve).toHaveBeenCalledOnce()
 })
 it('edits with the original calculation type after an administrator changes the mode',async()=>{
  db.gameType.findUnique.mockResolvedValue({id:3,calculType:'BOOLEAN',calculConfig:{type:'BOOLEAN',truePoints:100,falsePoints:0},team:false,videoGameId:9,videoGame:{}})
  await expect(submitPlay(1,input,7)).resolves.toMatchObject({id:7,status:'APPROVED'})
  expect(db.gameSession.update.mock.calls[0][0].data.scoringData.config).toEqual({type:'NUMBER',multiplier:2})
 })
 it('returns a rejected correction to the moderation queue without crediting it',async()=>{
  db.gameSession.findUnique.mockResolvedValue({...original,status:'REJECTED'})
  await expect(submitPlay(1,input,7)).resolves.toEqual({id:7,status:'PENDING'})
  expect(approve).not.toHaveBeenCalled()
 })
 it('keeps repeated corrections of a refused declaration pending until moderator approval',async()=>{
  db.gameSession.findUnique.mockResolvedValue({...original,status:'REJECTED'})
  await expect(submitPlay(1,input,7)).resolves.toEqual({id:7,status:'PENDING'})
  const snapshot=db.gameSession.update.mock.calls[0][0].data.scoringData
  expect(snapshot.requiresReview).toBe(true)
  db.gameSession.findUnique.mockResolvedValue({...original,status:'PENDING',scoringData:snapshot})
  await expect(submitPlay(1,{...input,value:8} as typeof input,7)).resolves.toEqual({id:7,status:'PENDING'})
  expect(db.gameSession.update.mock.calls[1][0].data.scoringData.requiresReview).toBe(true)
  expect(approve).not.toHaveBeenCalled()
 })
 it('protects already credited progression against edits invalidating later scores',async()=>{
  db.gameSession.findUnique.mockResolvedValue({...original,scoringData:{input,config:{type:'RULES',method:'HADES'}}})
  await expect(submitPlay(1,input,7)).rejects.toMatchObject({statusCode:409})
  expect(db.userGame.deleteMany).not.toHaveBeenCalled()
 })
})
