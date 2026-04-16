/*
  Warnings:

  - The primary key for the `UserGame` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "UserGame" DROP CONSTRAINT "UserGame_pkey",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD COLUMN     "playedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "score" INTEGER NOT NULL DEFAULT 0,
ADD CONSTRAINT "UserGame_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "VideoGame" ADD COLUMN     "imageUrl" TEXT;

-- CreateTable
CREATE TABLE "PointBonus" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "grantedById" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PointBonus_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PointBonus" ADD CONSTRAINT "PointBonus_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PointBonus" ADD CONSTRAINT "PointBonus_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
