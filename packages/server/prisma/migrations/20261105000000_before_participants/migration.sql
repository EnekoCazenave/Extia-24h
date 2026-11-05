-- Preserve fractional Before points while retaining all existing integer bonuses.
ALTER TABLE "PointBonus" ALTER COLUMN "points" TYPE DOUBLE PRECISION;

CREATE TABLE "BeforeParticipant" (
  "id" SERIAL NOT NULL,
  "sourceKey" TEXT NOT NULL,
  "sourceName" TEXT NOT NULL,
  "sourceRow" INTEGER NOT NULL,
  "rawName" TEXT NOT NULL,
  "firstname" TEXT NOT NULL,
  "lastname" TEXT NOT NULL,
  "firstnameKey" TEXT NOT NULL,
  "lastnameKey" TEXT NOT NULL,
  "points" DOUBLE PRECISION,
  "importedById" INTEGER NOT NULL,
  "userId" INTEGER,
  "bonusId" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BeforeParticipant_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "BeforeParticipant_points_check" CHECK ("points" IS NULL OR ("points" >= 0 AND "points" <= 1000000000))
);
CREATE UNIQUE INDEX "BeforeParticipant_bonusId_key" ON "BeforeParticipant"("bonusId");
CREATE UNIQUE INDEX "BeforeParticipant_sourceKey_firstnameKey_lastnameKey_key" ON "BeforeParticipant"("sourceKey", "firstnameKey", "lastnameKey");
CREATE INDEX "BeforeParticipant_firstnameKey_lastnameKey_userId_idx" ON "BeforeParticipant"("firstnameKey", "lastnameKey", "userId");
ALTER TABLE "BeforeParticipant" ADD CONSTRAINT "BeforeParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BeforeParticipant" ADD CONSTRAINT "BeforeParticipant_bonusId_fkey" FOREIGN KEY ("bonusId") REFERENCES "PointBonus"("id") ON DELETE SET NULL ON UPDATE CASCADE;
