import { Prisma } from '@prisma/client'
import { CalculConfigSchema, PlayInputSchema, computeAwards, roundScore, ScoringError, type PlayInput } from '@extia-gaming/shared'
import { prisma } from '../lib/prisma.js'

const sessionInclude = {
  userGames: { select: { userId: true, score: true } },
  submitter: { select: { id: true, login: true, firstname: true, lastname: true } },
  gameType: { include: { videoGame: { select: { id: true, nom: true } } } },
  teamMembers: { include: { user: { select: { id: true, login: true, firstname: true, lastname: true } } } },
} as const

export async function getSessions(gameId?: number, status?: string) {
  return prisma.gameSession.findMany({
    where: {
      ...(gameId ? { gameType: { videoGameId: gameId } } : {}),
      ...(status ? { status: status as 'PENDING' | 'APPROVED' | 'REJECTED' } : {}),
    },
    include: sessionInclude,
    orderBy: { createdAt: 'desc' },
  })
}

// Serializable transactions protect cumulative limits and one-time bonuses across sessions.
async function serializable<T>(work: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try { return await prisma.$transaction(work, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }) }
    catch (error) {
      if (attempt < 3 && error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') continue
      throw error
    }
  }
}

function valuesFor(input: PlayInput, userId: number) {
  return input.calculType === 'RULES' ? input.results?.find(r => r.userId === userId)?.values ?? input.values : {}
}

export async function approveSession(sessionId: number) {
  return serializable(tx => approveSessionInTransaction(tx, sessionId))
}

export async function approveSessionInTransaction(tx: Prisma.TransactionClient, sessionId: number) {
    const session = await tx.gameSession.findUnique({
      where: { id: sessionId }, include: { gameType: { include: { videoGame: true } }, teamMembers: true },
    })
    if (!session) throw new Error('SESSION_NOT_FOUND')
    if (session.status !== 'PENDING') throw new Error('SESSION_NOT_PENDING')
    const changed = await tx.gameSession.updateMany({ where: { id: sessionId, status: 'PENDING' }, data: { status: 'APPROVED', reviewedAt: new Date() } })
    if (changed.count !== 1) throw new Error('SESSION_NOT_PENDING')
    const userIds = [session.submitterId, ...session.teamMembers.map(m => m.userId)].sort((a,b) => a-b)
    const snapshot = session.scoringData as { config?: unknown; input?: unknown; happyHourMultiplier?: number } | null
    const config = CalculConfigSchema.parse(snapshot?.config ?? session.gameType.calculConfig)
    const input = snapshot?.input ? PlayInputSchema.parse(snapshot.input) : null
    // Legacy pending declarations retain their saved points; new ones are recalculated from the frozen barème.
    const { happyHourStart, happyHourEnd } = session.gameType.videoGame
    const factor = snapshot?.happyHourMultiplier ?? (happyHourStart && happyHourEnd && session.createdAt >= happyHourStart && session.createdAt <= happyHourEnd ? 2 : 1)
    const awards = input ? computeAwards(config, input, userIds) : userIds.map(userId => ({ userId, score: session.score }))
    if (config.type === 'RULES' && input?.calculType === 'RULES' && config.method === 'MINECRAFT' && input.values.communityCompleted === 1) {
      const previous = await tx.gameSession.findMany({ where: { gameTypeId: session.gameTypeId, status: 'APPROVED', id: { not: sessionId } }, select: { scoringData: true } })
      if (previous.some(row => (row.scoringData as { input?: { values?: { communityCompleted?: number } } } | null)?.input?.values?.communityCompleted === 1))
        throw new ScoringError('Le pot commun de ce mode a déjà été distribué')
    }
    for (const award of awards) {
      if (config.type === 'RULES' && input && ['HADES','PROGRESSION','MINECRAFT'].includes(config.method)) {
        const history = await tx.userGame.findMany({ where: { userId: award.userId, gameTypeId: session.gameTypeId }, include: { gameSession: { select: { scoringData: true } } } })
        const current = valuesFor(input, award.userId)
        const previousIntervals: Array<{ start: number; end: number }> = []
        for (const row of history) {
          const oldInput = (row.gameSession?.scoringData as { input?: unknown } | null)?.input
          const parsed = PlayInputSchema.safeParse(oldInput)
          if (!parsed.success) continue
          const previous = valuesFor(parsed.data, award.userId)
          if (previous.resumed === 0) previousIntervals.push({ start: previous.start, end: previous.end })
          if (config.method === 'HADES' && current.firstWin === 1 && previous.firstWin === 1) throw new ScoringError('Bonus de première réussite déjà attribué à ce participant')
          if (config.method === 'PROGRESSION' && previous.resumed === current.resumed && current.start < previous.end) throw new ScoringError('Cette progression recouvre des paliers déjà récompensés')
          if (config.method === 'MINECRAFT' && config.items.some(item => current[`item_${item.key}`] === 1 && previous[`item_${item.key}`] === 1)) throw new ScoringError('Un succès a déjà été récompensé pour ce participant')
        }
        if (config.method === 'PROGRESSION' && input.calculType === 'RULES' && current.resumed === 0 && current.start > 0 && current.end === config.items.length) {
          let reached = 0
          for (const interval of previousIntervals.sort((a,b) => a.start - b.start)) {
            if (interval.start === reached) reached = interval.end
          }
          if (reached === current.start) {
            const group = config.participantCoefficients.find(c => c.participants === userIds.length)?.coefficient ?? 1
            const mode = config.modes.find(m => m.key === input.mode)?.coefficient ?? 1
            award.score = roundScore(award.score + config.completionBonus * group * mode)
          }
        }
      }
      let score = roundScore(award.score * factor)
      if (config.type === 'RULES' && config.maxPoints !== null) {
        const previous = await tx.userGame.aggregate({ where: { userId: award.userId, gameType: { videoGameId: session.gameType.videoGameId } }, _sum: { score: true } })
        score = roundScore(Math.min(score, Math.max(0, config.maxPoints - (previous._sum.score ?? 0))))
      }
      if (session.gameType.maxPointsPerUser != null) {
        const previous = await tx.userGame.aggregate({ where: { userId: award.userId, gameTypeId: session.gameTypeId }, _sum: { score: true } })
        score = roundScore(Math.min(score, Math.max(0, session.gameType.maxPointsPerUser - roundScore(previous._sum.score ?? 0))))
      }
      await tx.userGame.create({ data: { userId: award.userId, gameTypeId: session.gameTypeId, score, gameSessionId: sessionId, playedAt: session.createdAt } })
    }
}

export async function rejectSession(sessionId: number) {
  return serializable(async tx => {
    const session = await tx.gameSession.findUnique({where:{id:sessionId}})
    if (!session) throw new Error('SESSION_NOT_FOUND')
    if (session.status === 'REJECTED') throw new Error('SESSION_NOT_PENDING')
    const changed = await tx.gameSession.updateMany({where:{id:sessionId,status:session.status},data:{status:'REJECTED',reviewedAt:new Date()}})
    if (changed.count !== 1) throw new Error('SESSION_NOT_PENDING')
    await tx.userGame.deleteMany({where:{gameSessionId:sessionId}})
  })
}
