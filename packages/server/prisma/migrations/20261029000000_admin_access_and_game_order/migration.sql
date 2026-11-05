ALTER TABLE "VideoGame" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;
CREATE TABLE "RoleChangeAudit" (
  "id" SERIAL NOT NULL,
  "actorId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  "previousRoleId" INTEGER NOT NULL,
  "roleId" INTEGER NOT NULL,
  "reason" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RoleChangeAudit_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "RoleChangeAudit_userId_createdAt_idx" ON "RoleChangeAudit"("userId", "createdAt");
ALTER TABLE "RoleChangeAudit" ADD CONSTRAINT "RoleChangeAudit_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RoleChangeAudit" ADD CONSTRAINT "RoleChangeAudit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
