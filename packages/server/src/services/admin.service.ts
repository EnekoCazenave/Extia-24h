import { prisma } from '../lib/prisma.js'
import type { CreateGameInput, UpdateGameInput, CreateGameTypeInput, UpdateGameTypeInput, UpdateHappyHourInput, GrantBonusInput } from '@extia-gaming/shared'

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

export async function updateGame(videoGameId: number, data: UpdateGameInput) {
  const game = await prisma.videoGame.findUnique({ where: { id: videoGameId } })
  if (!game) throw new Error('GAME_NOT_FOUND')

  return prisma.videoGame.update({
    where: { id: videoGameId },
    data: {
      nom: data.nom,
      imageUrl: data.imageUrl === undefined ? undefined : data.imageUrl,
      happyHourStart: data.happyHourStart === undefined ? undefined : (data.happyHourStart ? new Date(data.happyHourStart) : null),
      happyHourEnd: data.happyHourEnd === undefined ? undefined : (data.happyHourEnd ? new Date(data.happyHourEnd) : null),
    },
  })
}

export async function deleteGame(videoGameId: number) {
  const game = await prisma.videoGame.findUnique({ where: { id: videoGameId } })
  if (!game) throw new Error('GAME_NOT_FOUND')
  return prisma.videoGame.delete({ where: { id: videoGameId } })
}

export async function addGameType(videoGameId: number, data: CreateGameTypeInput) {
  const game = await prisma.videoGame.findUnique({ where: { id: videoGameId } })
  if (!game) throw new Error('GAME_NOT_FOUND')

  return prisma.gameType.create({
    data: {
      name: data.name,
      calculType: data.calculConfig.type,
      calculConfig: data.calculConfig,
      win: data.win,
      team: data.team,
      videoGameId,
    },
  })
}

export async function updateGameType(gameTypeId: number, data: UpdateGameTypeInput) {
  const gt = await prisma.gameType.findUnique({ where: { id: gameTypeId } })
  if (!gt) throw new Error('GAME_TYPE_NOT_FOUND')

  return prisma.gameType.update({
    where: { id: gameTypeId },
    data: {
      name: data.name,
      calculType: data.calculConfig.type,
      calculConfig: data.calculConfig,
      win: data.win,
      team: data.team,
    },
  })
}

export async function deleteGameType(gameTypeId: number) {
  const gt = await prisma.gameType.findUnique({ where: { id: gameTypeId } })
  if (!gt) throw new Error('GAME_TYPE_NOT_FOUND')
  return prisma.gameType.delete({ where: { id: gameTypeId } })
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
