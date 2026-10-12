ALTER TABLE "Event" ADD COLUMN "reminderMinutes" INTEGER NOT NULL DEFAULT 10 CHECK ("reminderMinutes" BETWEEN 0 AND 10080);
ALTER TABLE "SiteSettings"
  ADD COLUMN "notifyStartDiscord" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "notifyEndDiscord" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "startReminderMinutes" INTEGER NOT NULL DEFAULT 0 CHECK ("startReminderMinutes" BETWEEN 0 AND 10080),
  ADD COLUMN "endReminderMinutes" INTEGER NOT NULL DEFAULT 0 CHECK ("endReminderMinutes" BETWEEN 0 AND 10080);
CREATE TABLE "SiteNotificationDelivery" (
  "id" SERIAL PRIMARY KEY,
  "kind" TEXT NOT NULL,
  "scheduledAt" TIMESTAMP(3) NOT NULL,
  "sentAt" TIMESTAMP(3),
  "leaseUntil" TIMESTAMP(3),
  "attempts" INTEGER NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX "SiteNotificationDelivery_kind_scheduledAt_key" ON "SiteNotificationDelivery"("kind", "scheduledAt");
