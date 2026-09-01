-- CreateEnum
CREATE TYPE "BlockType" AS ENUM ('HEADING', 'TEXT', 'IMAGE', 'VIDEO', 'CTA_BUTTON', 'PROGRESS_BAR', 'DONATION_LINK', 'QUOTE');

-- CreateTable
CREATE TABLE "Association" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Association_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssociationBlock" (
    "id" SERIAL NOT NULL,
    "associationId" INTEGER NOT NULL,
    "type" "BlockType" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "content" JSONB NOT NULL,

    CONSTRAINT "AssociationBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Association_slug_key" ON "Association"("slug");

-- AddForeignKey
ALTER TABLE "AssociationBlock" ADD CONSTRAINT "AssociationBlock_associationId_fkey" FOREIGN KEY ("associationId") REFERENCES "Association"("id") ON DELETE CASCADE ON UPDATE CASCADE;
