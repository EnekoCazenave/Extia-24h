-- Initialize existing events with a positive value before requiring explicit points.
ALTER TABLE "Event" ADD COLUMN "pointsEarned" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Event" ALTER COLUMN "pointsEarned" DROP DEFAULT;
