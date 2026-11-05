ALTER TABLE "SiteSettings" ADD COLUMN "proofRequired" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN "homeSubtitle" TEXT;
ALTER TABLE "Event" ADD COLUMN "registrationRequired" BOOLEAN NOT NULL DEFAULT true, ADD COLUMN "awardsPoints" BOOLEAN NOT NULL DEFAULT true;
