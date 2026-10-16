-- Existing accounts have no statistics consent. Never infer it from the old checkbox.
ALTER TABLE "User"
  ADD COLUMN "termsAcceptedAt" TIMESTAMP(3),
  ADD COLUMN "adultConfirmedAt" TIMESTAMP(3),
  ADD COLUMN "termsVersion" TEXT,
  ADD COLUMN "statisticsConsent" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "statisticsConsentUpdatedAt" TIMESTAMP(3),
  ADD COLUMN "statisticsConsentVersion" TEXT;
