ALTER TABLE "GameType" ADD COLUMN "maxPointsPerUser" DOUBLE PRECISION;
ALTER TABLE "GameType" ADD CONSTRAINT "GameType_maxPointsPerUser_valid" CHECK ("maxPointsPerUser" IS NULL OR ("maxPointsPerUser" >= 0.000001 AND "maxPointsPerUser" <= 1000000000));
ALTER TABLE "GameType" ADD CONSTRAINT "GameType_single_limit" CHECK ("maxPlaysPerUser" IS NULL OR "maxPointsPerUser" IS NULL);
