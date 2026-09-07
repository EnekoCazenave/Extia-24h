import {Prisma} from '@prisma/client'
import {prisma} from '../lib/prisma.js'

const leaderboardScores = Prisma.sql`
    SELECT u.id                                                  AS "userId",
           u.login,
           u.firstname,
           u.lastname,
           COALESCE(ug_agg.total, 0) + COALESCE(pb_agg.total, 0) AS "totalScore"
    FROM "User" u
             LEFT JOIN (SELECT "userId", SUM(score) AS total
                        FROM "UserGame"
                        GROUP BY "userId") ug_agg ON ug_agg."userId" = u.id
             LEFT JOIN (SELECT "userId", SUM(points) AS total FROM "PointBonus" GROUP BY "userId") pb_agg
                       ON pb_agg."userId" = u.id
`

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
            SELECT *
            FROM (${leaderboardScores}) scores
            ORDER BY "totalScore" DESC, "userId" ASC
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

export async function retrieveLeaderBoardById(userId: number) {
    const rows = await prisma.$queryRaw<Array<{
        rank: bigint
        userId: number
        login: string
        firstname: string
        lastname: string
        totalScore: bigint
    }>>(Prisma.sql`
        SELECT *
        FROM (SELECT scores.*,
                     ROW_NUMBER() OVER (ORDER BY "totalScore" DESC, "userId" ASC) AS rank
              FROM (${leaderboardScores}) scores) ranked
        WHERE "userId" = ${userId}
    `)
    const row = rows[0]
    return row ? {...row, rank: Number(row.rank), totalScore: Number(row.totalScore)} : null
}

export async function getFilteredLeaderboard(opts: {
    gameId?: number
    gameTypeId?: number
    team?: boolean
    limit?: number
}) {
    const {gameId, gameTypeId, team, limit = 100} = opts

    const rows = await prisma.$queryRaw<
        Array<{
            userId: number
            login: string
            firstname: string
            lastname: string
            totalScore: bigint
            gameCount: bigint
        }>
    >(
        Prisma.sql`
            SELECT u.id                       AS "userId",
                   u.login,
                   u.firstname,
                   u.lastname,
                   COALESCE(SUM(ug.score), 0) AS "totalScore",
                   COUNT(ug.id)               AS "gameCount"
            FROM "User" u
                     INNER JOIN "UserGame" ug ON ug."userId" = u.id
                     INNER JOIN "GameType" gt ON gt.id = ug."gameTypeId"
                     INNER JOIN "VideoGame" vg ON vg.id = gt."videoGameId"
            WHERE 1 = 1
                ${gameId !== undefined ? Prisma.sql`AND vg.id = ${gameId}` : Prisma.sql``} ${gameTypeId !== undefined ? Prisma.sql`AND gt.id = ${gameTypeId}` : Prisma.sql``} ${team !== undefined ? Prisma.sql`AND gt.team = ${team}` : Prisma.sql``}
            GROUP BY u.id, u.login, u.firstname, u.lastname
            ORDER BY "totalScore" DESC
                LIMIT ${limit}
        `,
    )

    return rows.map((r, i) => ({
        rank: i + 1,
        userId: r.userId,
        login: r.login,
        firstname: r.firstname,
        lastname: r.lastname,
        totalScore: Number(r.totalScore),
        gameCount: Number(r.gameCount),
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
            SELECT vg.id                      AS "videoGameId",
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
