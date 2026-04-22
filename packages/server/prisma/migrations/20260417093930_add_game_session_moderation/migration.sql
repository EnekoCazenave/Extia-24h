-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "UserGame" ADD COLUMN     "gameSessionId" INTEGER;

-- CreateTable
CREATE TABLE "GameSession" (
    "id" SERIAL NOT NULL,
    "submitterId" INTEGER NOT NULL,
    "gameTypeId" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "proofUrl" TEXT,
    "status" "SessionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "GameSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameSessionMember" (
    "sessionId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "GameSessionMember_pkey" PRIMARY KEY ("sessionId","userId")
);

-- AddForeignKey
ALTER TABLE "UserGame" ADD CONSTRAINT "UserGame_gameSessionId_fkey" FOREIGN KEY ("gameSessionId") REFERENCES "GameSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_submitterId_fkey" FOREIGN KEY ("submitterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSession" ADD CONSTRAINT "GameSession_gameTypeId_fkey" FOREIGN KEY ("gameTypeId") REFERENCES "GameType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSessionMember" ADD CONSTRAINT "GameSessionMember_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GameSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameSessionMember" ADD CONSTRAINT "GameSessionMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
