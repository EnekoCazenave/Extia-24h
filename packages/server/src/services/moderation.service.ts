import { prisma } from '../lib/prisma.js'

const sessionInclude = {
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

function isHappyHour(start: Date | null, end: Date | null): boolean {
  if (!start || !end) return false
  const now = new Date()
  return now >= start && now <= end
}

export async function approveSession(sessionId: number) {
  const session = await prisma.gameSession.findUnique({
    where: { id: sessionId },
    include: {
      gameType: { include: { videoGame: true } },
      teamMembers: true,
    },
  })
  if (!session) throw new Error('SESSION_NOT_FOUND')
  if (session.status !== 'PENDING') throw new Error('SESSION_NOT_PENDING')

  const happyHour = isHappyHour(
    session.gameType.videoGame.happyHourStart,
    session.gameType.videoGame.happyHourEnd,
  )
  const finalScore = happyHour ? session.score * 2 : session.score

  const allUserIds = [session.submitterId, ...session.teamMembers.map((m) => m.userId)]

  await prisma.$transaction([
    prisma.gameSession.update({
      where: { id: sessionId },
      data: { status: 'APPROVED', reviewedAt: new Date() },
    }),
    ...allUserIds.map((uid) =>
      prisma.userGame.create({
        data: {
          userId: uid,
          gameTypeId: session.gameTypeId,
          score: finalScore,
          gameSessionId: sessionId,
        },
      }),
    ),
  ])
}

export async function rejectSession(sessionId: number) {
  const session = await prisma.gameSession.findUnique({ where: { id: sessionId } })
  if (!session) throw new Error('SESSION_NOT_FOUND')
  if (session.status !== 'PENDING') throw new Error('SESSION_NOT_PENDING')

  await prisma.gameSession.update({
    where: { id: sessionId },
    data: { status: 'REJECTED', reviewedAt: new Date() },
  })
}
