ALTER TABLE "SiteSettings" ADD COLUMN "discordUrl" TEXT, ADD COLUMN "honorTiers" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "Event" ADD COLUMN "notifyPush" BOOLEAN NOT NULL DEFAULT true, ADD COLUMN "notifyEmail" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN "notifyDiscord" BOOLEAN NOT NULL DEFAULT false;
CREATE TABLE "EventChannelDelivery" ("id" SERIAL PRIMARY KEY, "eventId" INTEGER NOT NULL REFERENCES "Event"("id") ON DELETE CASCADE, "destination" TEXT NOT NULL, "sentAt" TIMESTAMP(3), "leaseUntil" TIMESTAMP(3), "attempts" INTEGER NOT NULL DEFAULT 0);
CREATE UNIQUE INDEX "EventChannelDelivery_eventId_destination_key" ON "EventChannelDelivery"("eventId", "destination");
