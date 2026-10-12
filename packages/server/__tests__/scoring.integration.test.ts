import { beforeAll, beforeEach, afterAll, describe, it, expect } from 'vitest'
import { prisma } from '../src/lib/prisma.js'
import { submitPlay } from '../src/services/play.service.js'
import { approveSession, rejectSession } from '../src/services/moderation.service.js'
import { PlayInputSchema, RulesConfigSchema, type ScoringMethod } from '@extia-gaming/shared'

describe('Attribution des points en base', () => {
  let gameId: number, modeId: number, userIds: number[]
  beforeAll(async () => {
    const role = await prisma.role.findFirstOrThrow({ where: { name: 'user' } })
    userIds = []
    for (let i = 0; i < 2; i++) {
      const user = await prisma.user.create({ data: { login: `score-${i}`, email: `score-${Date.now()}-${i}@scoring.invalid`, firstname: 'Test', lastname: 'Scoring', password: 'not-a-login-hash', roleId: role.id } })
      userIds.push(user.id)
    }
    const game = await prisma.videoGame.create({ data: { nom: 'Scoring integration' } }); gameId = game.id
    const mode = await prisma.gameType.create({ data: { name: 'Test', calculType: 'RULES', calculConfig: RulesConfigSchema.parse({ type: 'RULES', method: 'MATCH', winPoints: 10 }), team: true, win: 'Victoire', videoGameId: gameId } }); modeId = mode.id
  })
  async function clearSessions() {
    if (!modeId) return
    await prisma.userGame.deleteMany({ where: { gameTypeId: modeId } })
    await prisma.gameSessionMember.deleteMany({ where: { session: { gameTypeId: modeId } } })
    await prisma.gameSession.deleteMany({ where: { gameTypeId: modeId } })
  }
  beforeEach(async () => { await prisma.gameType.update({ where: { id: modeId }, data: { maxPlaysPerUser: null, maxPointsPerUser: null } }); await clearSessions(); await configure('MATCH', { winPoints: 10 }); await prisma.videoGame.update({ where: { id: gameId }, data: { happyHourStart: null, happyHourEnd: null } }) })
  afterAll(async () => {
    await clearSessions()
    if (modeId) await prisma.gameType.delete({ where: { id: modeId } })
    if (gameId) await prisma.videoGame.delete({ where: { id: gameId } })
    if (userIds) await prisma.user.deleteMany({ where: { id: { in: userIds } } })
    await prisma.$disconnect()
  })
  async function configure(method: ScoringMethod, fields = {}) {
    await prisma.gameType.update({ where: { id: modeId }, data: { calculConfig: RulesConfigSchema.parse({ type: 'RULES', method, ...fields }) } })
  }
  function submit(values = { won: 1 }, teamMemberIds: number[] = []) {
    return submitPlay(userIds[0], PlayInputSchema.parse({ gameTypeId: modeId, calculType: 'RULES', values, teamMemberIds }))
  }
  async function total() { return (await prisma.userGame.aggregate({ where: { gameTypeId: modeId }, _sum: { score: true } }))._sum.score ?? 0 }


  it('plafonne les points par type après happy hour, même en validation concurrente', async () => {
    await prisma.gameType.update({where:{id:modeId},data:{maxPointsPerUser:25.5}})
    await prisma.videoGame.update({where:{id:gameId},data:{happyHourStart:new Date(Date.now()-60000),happyHourEnd:new Date(Date.now()+60000)}})
    await Promise.all([submit(),submit()])
    expect(await total()).toBe(25.5)
    await expect(submit()).rejects.toThrow('limite de 25.5 points')
    await prisma.gameType.update({where:{id:modeId},data:{maxPointsPerUser:null}})
    await submit()
    expect(await total()).toBe(45.5)
  })
  it('plafonne séparément les coéquipiers et prend en compte les anciens crédits', async () => {
    await prisma.gameType.update({where:{id:modeId},data:{maxPointsPerUser:15}})
    await prisma.userGame.create({data:{userId:userIds[1],gameTypeId:modeId,score:12}})
    const s=await submit({won:1},[userIds[1]])
    const awards=await prisma.userGame.findMany({where:{gameSessionId:s.id},orderBy:{userId:'asc'}})
    expect(awards.map(a=>a.score)).toEqual([10,3])
    await expect(submit({won:1},[userIds[1]])).rejects.toThrow('score-1 a atteint la limite de 15 points')
    await expect(submit()).resolves.toHaveProperty('id')
  })
  it('applique le plafond aux anciens calculs et ignore les parties refusées', async () => {
    await prisma.gameType.update({where:{id:modeId},data:{calculType:'BOOLEAN',calculConfig:{type:'BOOLEAN',trueValue:10,falseValue:0},maxPointsPerUser:5}})
    try {
      const input=PlayInputSchema.parse({gameTypeId:modeId,calculType:'BOOLEAN',value:true})
      const first=await submitPlay(userIds[0],input);await rejectSession(first.id)
      await submitPlay(userIds[0],input)
      expect(await total()).toBe(5)
    } finally { await prisma.gameType.update({where:{id:modeId},data:{calculType:'RULES'}}) }
  })
  it('permet de changer de limite et refuse deux plafonds simultanés', async () => {
    const {updateGameType}=await import('../src/services/admin.service.js')
    const {CreateGameTypeSchema}=await import('@extia-gaming/shared')
    const input={name:'Limité',win:'Victoire',team:true,calculConfig:RulesConfigSchema.parse({type:'RULES',method:'MATCH',winPoints:10})}
    await updateGameType(modeId,{...input,maxPlaysPerUser:2})
    const points=await updateGameType(modeId,{...input,maxPointsPerUser:12.5})
    expect(points.maxPlaysPerUser).toBeNull();expect(points.maxPointsPerUser).toBe(12.5)
    const plays=await updateGameType(modeId,{...input,maxPlaysPerUser:3})
    expect(plays.maxPointsPerUser).toBeNull()
    expect(CreateGameTypeSchema.safeParse({...input,maxPointsPerUser:5,maxPlaysPerUser:2}).success).toBe(false)
    for(const value of [0,-1,Infinity,0.0000001]) expect(CreateGameTypeSchema.safeParse({...input,maxPointsPerUser:value}).success).toBe(false)
  })
  it('limite les parties en attente et validées et libère les parties refusées', async () => {
    await prisma.gameType.update({where:{id:modeId},data:{maxPlaysPerUser:1}})
    const first = await submit()
    await expect(submit()).rejects.toThrow('limite de 1')
    await rejectSession(first.id)
    await submit()
    await expect(submit()).rejects.toThrow('limite de 1')
  })
  it('respecte la limite pour les coéquipiers et les déclarations simultanées', async () => {
    await prisma.gameType.update({where:{id:modeId},data:{maxPlaysPerUser:1}})
    const results = await Promise.allSettled([submit({won:1},[userIds[1]]), submit({won:1},[userIds[1]])])
    expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1)
    expect(await prisma.gameSession.count({where:{gameTypeId:modeId}})).toBe(1)
    await expect(submitPlay(userIds[1], PlayInputSchema.parse({gameTypeId:modeId,calculType:'RULES',values:{won:1}}))).rejects.toThrow('limite de 1')
  })
  it('refuse toute une équipe si un coéquipier a atteint sa limite', async () => {
    await prisma.gameType.update({where:{id:modeId},data:{maxPlaysPerUser:1}})
    await submitPlay(userIds[1], PlayInputSchema.parse({gameTypeId:modeId,calculType:'RULES',values:{won:1}}))
    await expect(submit({won:1},[userIds[1]])).rejects.toThrow('score-1 a atteint')
    expect(await prisma.gameSession.count({where:{gameTypeId:modeId}})).toBe(1)
  })
  it('compte les anciennes parties sans session et permet de retirer la limite', async () => {
    await prisma.userGame.create({data:{userId:userIds[0],gameTypeId:modeId,score:10}})
    await prisma.gameType.update({where:{id:modeId},data:{maxPlaysPerUser:1}})
    await expect(submit()).rejects.toThrow('limite de 1')
    await prisma.gameType.update({where:{id:modeId},data:{maxPlaysPerUser:null}})
    await submit(); await submit()
  })
  it('ne compte pas les parties d’un autre type et conserve la limite en administration', async () => {
    const { addGameType, updateGameType } = await import('../src/services/admin.service.js')
    const { CreateGameTypeSchema } = await import('@extia-gaming/shared')
    const input = CreateGameTypeSchema.parse({name:'Limité',win:'Victoire',calculConfig:{type:'BOOLEAN',trueValue:10,falseValue:0},maxPlaysPerUser:1})
    const other = await addGameType(gameId,input)
    try {
      expect(other.maxPlaysPerUser).toBe(1)
      const play = await submitPlay(userIds[0],PlayInputSchema.parse({gameTypeId:other.id,calculType:'BOOLEAN',value:true}))
      await prisma.gameType.update({where:{id:modeId},data:{maxPlaysPerUser:1}})
      await expect(submit()).resolves.toHaveProperty('id')
      expect((await updateGameType(other.id,{...input,maxPlaysPerUser:null})).maxPlaysPerUser).toBeNull()
      await rejectSession(play.id)
      await prisma.gameSession.delete({where:{id:play.id}})
    } finally { await prisma.gameType.delete({where:{id:other.id}}) }
    for(const value of [0,-1,1.5,2147483648]) expect(CreateGameTypeSchema.safeParse({...input,maxPlaysPerUser:value}).success).toBe(false)
  })

  it('valide immédiatement et conserve le barème de soumission', async () => {
    const session = await submit()
    expect(session.status).toBe('APPROVED')
    expect(await total()).toBe(10)
    await configure('MATCH', { winPoints: 100 })
    await expect(approveSession(session.id)).rejects.toThrow('SESSION_NOT_PENDING')
    expect(await total()).toBe(10)
  })
  it('ne crédite jamais une partie rejetée', async () => {
    const session = await submit(); await rejectSession(session.id)
    await expect(approveSession(session.id)).rejects.toThrow('SESSION_NOT_PENDING')
    expect(await total()).toBe(0)
  })
  it('ne crédite qu’une fois lors de validations concurrentes', async () => {
    const session = await submit()
    const results = await Promise.allSettled([approveSession(session.id), approveSession(session.id)])
    expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(0)
    expect(await total()).toBe(10)
  })
  it('respecte un plafond cumulé même pour deux sessions concurrentes', async () => {
    await configure('MATCH', { winPoints: 10, maxPoints: 15 })
    await Promise.all([submit(), submit()])
    expect(await total()).toBe(15)
  })
  it('conserve les fractions du Battle Royale en base', async () => {
    await configure('BATTLE_ROYALE')
    const session = await submitPlay(userIds[0], PlayInputSchema.parse({ gameTypeId: modeId, calculType: 'RULES', values: { rank: 99, total: 100 } }))
    expect(await total()).toBe(0.006)
  })
  it('partage le pot entre participants sans multiplier son montant', async () => {
    await configure('MINIGAME', { attendancePoints: 10 })
    const session = await submitPlay(userIds[0], PlayInputSchema.parse({ gameTypeId: modeId, calculType: 'RULES', teamMemberIds: [userIds[1]], values: { winnerId: userIds[1] } }))
    const rows = await prisma.userGame.findMany({ where: { gameTypeId: modeId }, orderBy: { userId: 'asc' } })
    expect(rows.map(r => r.score)).toEqual([9.5,10.5]); expect(await total()).toBe(20)
  })
  it('fige le happy hour à la déclaration, pas à la modération', async () => {
    await prisma.videoGame.update({ where: { id: gameId }, data: { happyHourStart: new Date(Date.now()-60000), happyHourEnd: new Date(Date.now()+60000) } })
    const session = await submit()
    await prisma.videoGame.update({ where: { id: gameId }, data: { happyHourStart: null, happyHourEnd: null } })
    expect(await total()).toBe(20)
  })
  it('refuse les coéquipiers dupliqués et introuvables', async () => {
    await expect(submit({won:1}, [userIds[0]])).rejects.toThrow('participants')
    await expect(submit({won:1}, [2147483647])).rejects.toThrow('introuvable')
  })
  it('accorde une seule fois le bonus de première réussite', async () => {
    await configure('HADES', { winPoints: 10, firstWinBonus: 50, items: [{ key: 'gold', label: 'Or', points: 1 }] })
    const input = PlayInputSchema.parse({ gameTypeId: modeId, calculType: 'RULES', values: { won: 1, firstWin: 1, difficulty: 0, item_gold: 0 } })
    await submitPlay(userIds[0], input)
    await expect(submitPlay(userIds[0], input)).rejects.toThrow('déjà attribué')
    expect(await total()).toBe(60)
    expect(await prisma.gameSession.count({where:{gameTypeId:modeId}})).toBe(1)
  })
  it('empêche de récompenser deux fois un succès Minecraft', async () => {
    await configure('MINECRAFT', { items: [{ key:'dragon',label:'Dragon',points:20 }] })
    const input = PlayInputSchema.parse({ gameTypeId: modeId, calculType: 'RULES', values: { communityCompleted:0,item_dragon:1 } })
    await submitPlay(userIds[0], input)
    await expect(submitPlay(userIds[0], input)).rejects.toThrow('déjà été récompensé')
  })
  it('accorde le pactole après une progression continue déclarée en plusieurs étapes', async () => {
    await configure('PROGRESSION', { items: [{key:'a',label:'A',points:10},{key:'b',label:'B',points:20}], completionBonus:100 })
    async function interval(start: number, end: number) {
      return submitPlay(userIds[0], PlayInputSchema.parse({ gameTypeId: modeId, calculType:'RULES', values:{start,end,resumed:0} }))
    }
    await interval(0,1)
    await interval(1,2)
    expect(await total()).toBe(130)
    await expect(interval(0,2)).rejects.toThrow('déjà récompensés')
  })
})
