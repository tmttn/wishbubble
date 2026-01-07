-- Add GIN index for full-text search on FeedProduct
-- This enables efficient text search queries using PostgreSQL's full-text search
-- Note: For large production tables, consider running with CONCURRENTLY outside of Prisma migrations
CREATE INDEX IF NOT EXISTS "FeedProduct_search_idx"
ON "FeedProduct"
USING GIN (to_tsvector('english', "searchText"));

-- Add partial index for active members (commonly queried)
-- This index only includes members who haven't left, making it smaller and faster
CREATE INDEX IF NOT EXISTS "BubbleMember_active_idx"
ON "BubbleMember" ("bubbleId")
WHERE "leftAt" IS NULL;

-- Add partial index for active bubbles
-- This index only includes non-archived bubbles for faster owner lookups
CREATE INDEX IF NOT EXISTS "Bubble_active_owner_idx"
ON "Bubble" ("ownerId")
WHERE "archivedAt" IS NULL;

-- Add partial index for pending email queue items
-- This is heavily queried by cron jobs processing the email queue
CREATE INDEX IF NOT EXISTS "EmailQueue_pending_idx"
ON "EmailQueue" ("scheduledFor")
WHERE "status" = 'PENDING';
