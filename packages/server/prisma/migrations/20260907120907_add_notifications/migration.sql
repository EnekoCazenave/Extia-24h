-- CreateTable
CREATE TABLE "SubscriptionNotification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "expirationTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionNotification_endpoint_key" ON "SubscriptionNotification"("endpoint");

-- CreateIndex
CREATE INDEX "SubscriptionNotification_userId_idx" ON "SubscriptionNotification"("userId");

-- AddForeignKey
ALTER TABLE "SubscriptionNotification" ADD CONSTRAINT "SubscriptionNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
