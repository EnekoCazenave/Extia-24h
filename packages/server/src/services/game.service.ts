import { prisma } from '../lib/prisma.js'

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

  const eventScores=await prisma.eventAward.findMany({select:{points:true,event:{select:{videoGameId:true}}}})
  return games.map((game) => {
    const totalScore = game.gameTypes.reduce(
      (sum, gt) => sum + (scoreByGameType.get(gt.id) ?? 0),
      0,
    )
    return { ...game, totalScore:totalScore+eventScores.filter(e=>e.event.videoGameId===game.id).reduce((sum,e)=>sum+e.points,0) }
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

  const eventScores=await prisma.eventAward.groupBy({by:['userId'],where:{event:{videoGameId:id}},_sum:{points:true}})
  for(const award of eventScores) {
    const row=userScores.find(r=>r.userId===award.userId)
    if(row)row._sum.score=(row._sum.score??0)+(award._sum.points??0)
    else userScores.push({userId:award.userId,_sum:{score:award._sum.points??0}})
  }
  userScores.sort((a,b)=>(b._sum.score??0)-(a._sum.score??0)||a.userId-b.userId)
  const userIds = userScores.map((s) => s.userId)
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, login: true },
  })
  const userMap = new Map(users.map((u) => [u.id, u]))

  const rankings = userScores.map((s, index) => ({
    rank: index + 1,
    userId: s.userId,
    login: userMap.get(s.userId)?.login ?? '',
    gameScore: s._sum.score ?? 0,
  }))

  const totalScore = userScores.reduce((sum, s) => sum + (s._sum.score ?? 0), 0)

  return { ...game, totalScore, rankings }
}
