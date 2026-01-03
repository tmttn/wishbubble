-- Move PIN fields from Bubble to BubbleMember
-- This enables personal PINs per member instead of shared group PINs

-- Step 1: Add PIN columns to BubbleMember
ALTER TABLE "BubbleMember" ADD COLUMN "pinHash" TEXT;
ALTER TABLE "BubbleMember" ADD COLUMN "pinEnabledAt" TIMESTAMP(3);

-- Step 2: Migrate existing PINs from Bubble to BubbleMember
-- Copy PIN to the owner's membership (since only owners could set PINs before)
UPDATE "BubbleMember" bm
SET
  "pinHash" = b."pinHash",
  "pinEnabledAt" = b."pinEnabledAt"
FROM "Bubble" b
WHERE bm."bubbleId" = b.id
  AND bm."userId" = b."ownerId"
  AND b."pinHash" IS NOT NULL;

-- Step 3: Remove PIN columns from Bubble
ALTER TABLE "Bubble" DROP COLUMN "pinHash";
ALTER TABLE "Bubble" DROP COLUMN "pinEnabledAt";
