import { Prisma } from '@prisma/client'
import { prisma } from '../lib/prisma.js'

export async function getGlobalLeaderboard(limit = 20) {
  const rows = await prisma.$queryRaw<
    Array<{
      userId: number
      login: string
      firstname: string
      lastname: string
      totalScore: bigint
    }>
  >(
    Prisma.sql`
      SELECT
        u.id AS "userId",
        u.login,
        u.firstname,
        u.lastname,
        COALESCE(SUM(ug.score), 0) + COALESCE(SUM(pb.points), 0) AS "totalScore"
      FROM "User" u
      LEFT JOIN "UserGame" ug ON ug."userId" = u.id
      LEFT JOIN "PointBonus" pb ON pb."userId" = u.id
      GROUP BY u.id, u.login, u.firstname, u.lastname
      ORDER BY "totalScore" DESC
      LIMIT ${limit}
    `,
  )

  return rows.map((r, index) => ({
    rank: index + 1,
    userId: r.userId,
    login: r.login,
    firstname: r.firstname,
    lastname: r.lastname,
    totalScore: Number(r.totalScore),
  }))
}

export async function getTopGamesByScore(limit = 5) {
  const rows = await prisma.$queryRaw<
    Array<{
      videoGameId: number
      nom: string
      imageUrl: string | null
      totalScore: bigint
    }>
  >(
    Prisma.sql`
      SELECT
        vg.id AS "videoGameId",
        vg.nom,
        vg."imageUrl",
        COALESCE(SUM(ug.score), 0) AS "totalScore"
      FROM "VideoGame" vg
      LEFT JOIN "GameType" gt ON gt."videoGameId" = vg.id
      LEFT JOIN "UserGame" ug ON ug."gameTypeId" = gt.id
      GROUP BY vg.id, vg.nom, vg."imageUrl"
      ORDER BY "totalScore" DESC
      LIMIT ${limit}
    `,
  )

  return rows.map((r) => ({
    videoGameId: r.videoGameId,
    nom: r.nom,
    imageUrl: r.imageUrl,
    totalScore: Number(r.totalScore),
  }))
}
