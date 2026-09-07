-- CreateEnum
CREATE TYPE "CalculType" AS ENUM ('BOOLEAN', 'NUMBER', 'TIME');

-- Step 1: add new columns as nullable so existing rows survive
ALTER TABLE "GameType"
  ADD COLUMN "calculType" "CalculType",
  ADD COLUMN "calculConfig" JSONB;

-- Step 2: backfill existing rows with a safe NUMBER default (multiplier = 1).
-- Legacy free-text "calcul" is preserved inside calculConfig.legacyLabel so admins
-- can reconfigure from the old value. Admin must review each game type afterwards.
UPDATE "GameType"
SET
  "calculType" = 'NUMBER',
  "calculConfig" = jsonb_build_object(
    'type', 'NUMBER',
    'multiplier', 1,
    'legacyLabel', COALESCE("calcul", '')
  )
WHERE "calculType" IS NULL;

-- Step 3: enforce NOT NULL now that every row has been backfilled
ALTER TABLE "GameType"
  ALTER COLUMN "calculType" SET NOT NULL,
  ALTER COLUMN "calculConfig" SET NOT NULL;

-- Step 4: drop legacy free-text column
ALTER TABLE "GameType" DROP COLUMN "calcul";
