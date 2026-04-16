import { prisma } from '../lib/prisma.js'
import type { PlayInput } from '@extia-gaming/shared'

function isHappyHour(start: Date | null, end: Date | null): boolean {
  if (!start || !end) return false
  const now = new Date()
  return now >= start && now <= end
}

export async function submitPlay(userId: number, input: PlayInput) {
  const gameType = await prisma.gameType.findUnique({
    where: { id: input.gameTypeId },
    include: { videoGame: true },
  })
  if (!gameType) throw new Error('GAME_TYPE_NOT_FOUND')

  const happyHour = isHappyHour(gameType.videoGame.happyHourStart, gameType.videoGame.happyHourEnd)
  const finalScore = happyHour ? input.score * 2 : input.score

  const session = await prisma.userGame.create({
    data: {
      userId,
      gameTypeId: input.gameTypeId,
      score: finalScore,
    },
  })

  return { ...session, happyHourApplied: happyHour, originalScore: input.score }
}
