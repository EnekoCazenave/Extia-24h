-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "settledAt" TIMESTAMP(3),
ADD COLUMN     "twitchUrl" TEXT,
ADD COLUMN     "winnerId" INTEGER,
ADD COLUMN     "winnerShare" DOUBLE PRECISION NOT NULL DEFAULT 0.05,
ALTER COLUMN "pointsEarned" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "EventNotificationDelivery" ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "leaseUntil" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "groupId" INTEGER;

-- CreateTable
CREATE TABLE "EventAward" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "eventId" INTEGER NOT NULL,
    "points" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventAward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationGroup" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'AGENCY',
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "OrganizationGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupPoint" (
    "id" SERIAL NOT NULL,
    "groupId" INTEGER NOT NULL,
    "points" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "grantedById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "eventStart" TIMESTAMP(3),
    "eventEnd" TIMESTAMP(3),

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectTask" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "assignee" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventAward_eventId_userId_key" ON "EventAward"("eventId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationGroup_name_key" ON "OrganizationGroup"("name");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "OrganizationGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventAward" ADD CONSTRAINT "EventAward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventAward" ADD CONSTRAINT "EventAward_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupPoint" ADD CONSTRAINT "GroupPoint_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "OrganizationGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
