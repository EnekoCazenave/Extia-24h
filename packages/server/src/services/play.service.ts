import { approveSessionInTransaction } from './moderation.service.js'
import { honorProgress } from './honor.service.js'
import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { computeAwards, roundScore, ScoringError, CalculConfigSchema, type PlayInput } from '@extia-gaming/shared'

export async function submitPlay(userId: number, input: PlayInput) {
  return withSubmissionTransaction(async tx => {
    const gameType = await tx.gameType.findUnique({
      where: { id: input.gameTypeId },
      include: { videoGame: true },
    })
    if (!gameType) throw new Error('GAME_TYPE_NOT_FOUND')
    if (gameType.calculType !== input.calculType) throw new Error('CALCUL_TYPE_MISMATCH')

    const config = CalculConfigSchema.parse(gameType.calculConfig)
    const members = input.teamMemberIds ?? []
    const userIds = [userId, ...members]
    if ((!gameType.team && members.length) || new Set(userIds).size !== userIds.length || userIds.length > 1000)
      throw new ScoringError('Liste des participants invalide')
    if (members.length) {
      const users = await tx.user.count({ where: { id: { in: members } } })
      if (users !== members.length) throw new ScoringError('Un coéquipier est introuvable')
    }
    if (gameType.maxPlaysPerUser != null) {
      for (const participantId of userIds) {
        const sessions = await tx.gameSession.count({ where: {
          gameTypeId: gameType.id, status: { in: ['PENDING', 'APPROVED'] },
          OR: [{ submitterId: participantId }, { teamMembers: { some: { userId: participantId } } }, { userGames: { some: { userId: participantId } } }],
        } })
        const legacyPlays = await tx.userGame.count({ where: { gameTypeId: gameType.id, userId: participantId, gameSessionId: null } })
        if (sessions + legacyPlays >= gameType.maxPlaysPerUser) {
          const participant = await tx.user.findUniqueOrThrow({ where: { id: participantId }, select: { login: true } })
          throw new ScoringError(
            participantId === userId
              ? `Vous avez atteint la limite de ${gameType.maxPlaysPerUser} partie(s) pour ce type de partie.`
              : `${participant.login} a atteint la limite de ${gameType.maxPlaysPerUser} partie(s) pour ce type de partie.`,
          )
        }
      }
    }
    if (gameType.maxPointsPerUser != null) {
      for (const participantId of userIds) {
        const total = await tx.userGame.aggregate({ where: { gameTypeId: gameType.id, userId: participantId }, _sum: { score: true } })
        if (roundScore(total._sum.score ?? 0) >= gameType.maxPointsPerUser) {
          const participant = await tx.user.findUniqueOrThrow({ where: { id: participantId }, select: { login: true } })
          throw new ScoringError(`${participantId === userId ? 'Vous avez' : participant.login + ' a'} atteint la limite de ${gameType.maxPointsPerUser} points pour ce type de partie.`)
        }
      }
    }
    const awards = computeAwards(config, input, userIds)
    const now = new Date()
    const { happyHourStart, happyHourEnd } = gameType.videoGame
    const happyHourMultiplier = happyHourStart && happyHourEnd && now >= happyHourStart && now <= happyHourEnd ? 2 : 1
    const score = roundScore(awards.reduce((sum, award) => sum + award.score * happyHourMultiplier, 0))

    const session = await tx.gameSession.create({
      data: {
        submitterId: userId,
        gameTypeId: input.gameTypeId,
        score,
        scoringData: JSON.parse(JSON.stringify({ config, input, awards, happyHourMultiplier })),
        proofUrl: input.proofUrl ?? null,
        teamMembers: {
          create: (input.teamMemberIds ?? []).map((uid) => ({ userId: uid })),
        },
      },
    })

    await approveSessionInTransaction(tx, session.id)
    return { id: session.id, status: 'APPROVED' as const, honor: await honorProgress(userId, tx) }
  })
}

// Count and reserve places atomically, including simultaneous team submissions.
async function withSubmissionTransaction<T>(work: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try { return await prisma.$transaction(work, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }) }
    catch (error) {
      if (attempt < 3 && error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') continue
      throw error
    }
  }
}
