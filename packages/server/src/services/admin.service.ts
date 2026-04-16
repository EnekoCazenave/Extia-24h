import { prisma } from '../lib/prisma.js'
import type { CreateGameInput, CreateGameTypeInput, UpdateHappyHourInput, GrantBonusInput } from '@extia-gaming/shared'

export async function createGame(data: CreateGameInput) {
  return prisma.videoGame.create({
    data: {
      nom: data.nom,
      imageUrl: data.imageUrl ?? null,
      happyHourStart: data.happyHourStart ? new Date(data.happyHourStart) : null,
      happyHourEnd: data.happyHourEnd ? new Date(data.happyHourEnd) : null,
    },
  })
}

export async function addGameType(videoGameId: number, data: CreateGameTypeInput) {
  const game = await prisma.videoGame.findUnique({ where: { id: videoGameId } })
  if (!game) throw new Error('GAME_NOT_FOUND')

  return prisma.gameType.create({
    data: {
      name: data.name,
      calcul: data.calcul,
      win: data.win,
      team: data.team,
      videoGameId,
    },
  })
}

export async function updateHappyHour(videoGameId: number, data: UpdateHappyHourInput) {
  const game = await prisma.videoGame.findUnique({ where: { id: videoGameId } })
  if (!game) throw new Error('GAME_NOT_FOUND')

  return prisma.videoGame.update({
    where: { id: videoGameId },
    data: {
      happyHourStart: data.happyHourStart ? new Date(data.happyHourStart) : null,
      happyHourEnd: data.happyHourEnd ? new Date(data.happyHourEnd) : null,
    },
  })
}

export async function grantBonus(grantedById: number, data: GrantBonusInput) {
  const targetUser = await prisma.user.findUnique({ where: { id: data.userId } })
  if (!targetUser) throw new Error('USER_NOT_FOUND')

  return prisma.pointBonus.create({
    data: {
      userId: data.userId,
      grantedById,
      points: data.points,
      reason: data.reason ?? null,
    },
  })
}
