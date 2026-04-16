import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function listGamesWithScores() {
  const games = await prisma.videoGame.findMany({
    include: { gameTypes: true },
    orderBy: { id: 'asc' },
  })

  const scoreSums = await prisma.userGame.groupBy({
    by: ['gameTypeId'],
    _sum: { score: true },
  })

  const scoreByGameType = new Map(
    scoreSums.map((s) => [s.gameTypeId, s._sum.score ?? 0]),
  )

  return games.map((game) => {
    const totalScore = game.gameTypes.reduce(
      (sum, gt) => sum + (scoreByGameType.get(gt.id) ?? 0),
      0,
    )
    return { ...game, totalScore }
  })
}

export async function getGameDetail(id: number) {
  const game = await prisma.videoGame.findUnique({
    where: { id },
    include: { gameTypes: true },
  })
  if (!game) return null

  const gameTypeIds = game.gameTypes.map((gt) => gt.id)

  const userScores = await prisma.userGame.groupBy({
    by: ['userId'],
    where: { gameTypeId: { in: gameTypeIds } },
    _sum: { score: true },
    orderBy: { _sum: { score: 'desc' } },
  })

  const userIds = userScores.map((s) => s.userId)
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, login: true, firstname: true, lastname: true },
  })
  const userMap = new Map(users.map((u) => [u.id, u]))

  const rankings = userScores.map((s, index) => ({
    rank: index + 1,
    userId: s.userId,
    login: userMap.get(s.userId)?.login ?? '',
    firstname: userMap.get(s.userId)?.firstname ?? '',
    lastname: userMap.get(s.userId)?.lastname ?? '',
    gameScore: s._sum.score ?? 0,
  }))

  const totalScore = userScores.reduce((sum, s) => sum + (s._sum.score ?? 0), 0)

  return { ...game, totalScore, rankings }
}
