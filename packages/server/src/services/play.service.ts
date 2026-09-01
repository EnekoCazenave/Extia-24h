import { prisma } from '../lib/prisma.js'
import { computeScore, CalculConfigSchema, type PlayInput } from '@extia-gaming/shared'

export async function submitPlay(userId: number, input: PlayInput) {
  const gameType = await prisma.gameType.findUnique({
    where: { id: input.gameTypeId },
    include: { videoGame: true },
  })
  if (!gameType) throw new Error('GAME_TYPE_NOT_FOUND')
  if (gameType.calculType !== input.calculType) throw new Error('CALCUL_TYPE_MISMATCH')

  const config = CalculConfigSchema.parse(gameType.calculConfig)
  const score = computeScore(config, input)

  const session = await prisma.gameSession.create({
    data: {
      submitterId: userId,
      gameTypeId: input.gameTypeId,
      score,
      proofUrl: input.proofUrl ?? null,
      teamMembers: {
        create: (input.teamMemberIds ?? []).map((uid) => ({ userId: uid })),
      },
    },
  })

  return { id: session.id, status: session.status }
}
