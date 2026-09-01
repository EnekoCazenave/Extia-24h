/*
  Warnings:

  - Added the required column `description` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endsAt` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `maxPlaces` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startsAt` to the `Event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Event` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "UserEvent" DROP CONSTRAINT "UserEvent_eventId_fkey";

-- DropForeignKey
ALTER TABLE "UserEvent" DROP CONSTRAINT "UserEvent_userId_fkey";

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "endsAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "maxPlaces" INTEGER NOT NULL,
ADD COLUMN     "startsAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "videoGameId" INTEGER;

-- AlterTable
ALTER TABLE "UserEvent" ADD COLUMN     "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "UserEvent_eventId_idx" ON "UserEvent"("eventId");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_videoGameId_fkey" FOREIGN KEY ("videoGameId") REFERENCES "VideoGame"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEvent" ADD CONSTRAINT "UserEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEvent" ADD CONSTRAINT "UserEvent_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
