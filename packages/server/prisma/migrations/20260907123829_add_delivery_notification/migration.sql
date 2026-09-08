-- CreateTable
CREATE TABLE "EventNotificationDelivery" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "subscriptionId" INTEGER NOT NULL,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "EventNotificationDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventNotificationDelivery_eventId_subscriptionId_key" ON "EventNotificationDelivery"("eventId", "subscriptionId");

-- AddForeignKey
ALTER TABLE "EventNotificationDelivery" ADD CONSTRAINT "EventNotificationDelivery_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventNotificationDelivery" ADD CONSTRAINT "EventNotificationDelivery_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "SubscriptionNotification"("id") ON DELETE CASCADE ON UPDATE CASCADE;
