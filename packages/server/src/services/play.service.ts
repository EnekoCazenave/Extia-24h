import { approveSessionInTransaction } from './moderation.service.js'
import { requireUploadedProof } from './proof.service.js'
import { honorProgress } from './honor.service.js'
import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma.js'
import { computeAwards, finalGain, roundScore, ScoringError, CalculConfigSchema, type PlayInput, PlayInputSchema } from '@extia-gaming/shared'

export class PlaySessionError extends Error {
  constructor(message: string, public statusCode: number) { super(message) }
}

export function canEditSession(session: {status: string; scoringData: unknown}) {
  const snapshot = session.scoringData as { input?: unknown; config?: unknown } | null
  if (!PlayInputSchema.safeParse(snapshot?.input).success) return false
  const config = CalculConfigSchema.safeParse(snapshot?.config)
  return session.status !== 'APPROVED' || (config.success && !(config.data.type === 'RULES' && ['PROGRESSION','HADES','MINECRAFT'].includes(config.data.method)))
}

export async function getEditableSession(userId: number, sessionId: number) {
  const session = await prisma.gameSession.findUnique({where:{id:sessionId},include:{gameType:true}})
  if (!session || session.submitterId !== userId) throw new PlaySessionError('Déclaration introuvable',404)
  if (!canEditSession(session)) throw new PlaySessionError('Cette déclaration ne peut pas être modifiée : son barème dépend de la progression déjà créditée.',409)
  const snapshot = session.scoringData as {input: unknown; config: unknown; happyHourMultiplier?: number}
  return {id:session.id,status:session.status,gameId:session.gameType.videoGameId,input:PlayInputSchema.parse(snapshot.input),calculConfig:CalculConfigSchema.parse(snapshot.config),happyHourMultiplier:snapshot.happyHourMultiplier ?? 1}
}

export async function submitPlay(userId: number, input: PlayInput, sessionId?: number) {
  return withSubmissionTransaction(async tx => {
    const existing = sessionId === undefined ? null : await tx.gameSession.findUnique({where:{id:sessionId}})
    if (sessionId !== undefined && (!existing || existing.submitterId !== userId)) throw new PlaySessionError('Déclaration introuvable',404)
    if (existing && (!canEditSession(existing) || existing.gameTypeId !== input.gameTypeId)) throw new PlaySessionError('Le mode de jeu ne peut pas être changé, ou cette déclaration ne peut plus être modifiée.',409)
    await requireUploadedProof(tx, input.proofUrl)
    if (existing) await tx.userGame.deleteMany({where:{gameSessionId:existing.id}})
    const gameType = await tx.gameType.findUnique({
      where: { id: input.gameTypeId },
      include: { videoGame: true },
    })
    if (!gameType) throw new Error('GAME_TYPE_NOT_FOUND')
    const previousSnapshot = existing?.scoringData as { config?: unknown; happyHourMultiplier?: number; requiresReview?: boolean } | null
    const config = CalculConfigSchema.parse(previousSnapshot?.config ?? gameType.calculConfig)
    if ((existing ? config.type : gameType.calculType) !== input.calculType) throw new Error('CALCUL_TYPE_MISMATCH')
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
          gameTypeId: gameType.id, ...(existing ? {id:{not:existing.id}} : {}), status: { in: ['PENDING', 'APPROVED'] },
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
    const awards = computeAwards(config, input, userIds, true)
    const now = existing?.createdAt ?? new Date()
    const { happyHourStart, happyHourEnd } = gameType.videoGame
    const happyHourMultiplier = previousSnapshot?.happyHourMultiplier ?? (happyHourStart && happyHourEnd && now >= happyHourStart && now <= happyHourEnd ? 2 : 1)
    const score = roundScore(awards.reduce((sum, award) => sum + finalGain(award.score * happyHourMultiplier, 2), 0))

    const requiresReview = existing?.status === 'REJECTED' || previousSnapshot?.requiresReview === true
    const sessionData = {
      submitterId: userId,
      gameTypeId: input.gameTypeId,
      score,
      scoringData: JSON.parse(JSON.stringify({ version: 2, config, input, awards, happyHourMultiplier, requiresReview })),
      proofUrl: input.proofUrl ?? null,
      status: 'PENDING' as const,
      reviewedAt: null,
      teamMembers: { create: (input.teamMemberIds ?? []).map(userId => ({ userId })) },
    }
    if (existing) await tx.gameSessionMember.deleteMany({where:{sessionId:existing.id}})
    const session = existing
      ? await tx.gameSession.update({where:{id:existing.id},data:sessionData})
      : await tx.gameSession.create({data:sessionData})

    // A correction of a rejected declaration requires a fresh moderator review.
    if (requiresReview && existing?.status !== 'APPROVED') return {id:session.id,status:'PENDING' as const}
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
