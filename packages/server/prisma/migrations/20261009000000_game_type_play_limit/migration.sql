ALTER TABLE "GameType" ADD COLUMN "maxPlaysPerUser" INTEGER;
ALTER TABLE "GameType" ADD CONSTRAINT "GameType_maxPlaysPerUser_positive"
  CHECK ("maxPlaysPerUser" IS NULL OR "maxPlaysPerUser" > 0);
