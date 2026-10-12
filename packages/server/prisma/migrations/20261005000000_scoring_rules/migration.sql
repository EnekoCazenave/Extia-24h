ALTER TYPE "CalculType" ADD VALUE 'RULES';
ALTER TABLE "UserGame" ALTER COLUMN "score" TYPE DOUBLE PRECISION;
ALTER TABLE "GameSession" ALTER COLUMN "score" TYPE DOUBLE PRECISION;
ALTER TABLE "GameSession" ADD COLUMN "scoringData" JSONB;
CREATE UNIQUE INDEX "UserGame_gameSessionId_userId_key" ON "UserGame"("gameSessionId", "userId");
