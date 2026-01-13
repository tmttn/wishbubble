import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Database connection string not found");
}

// SSL config: defaults to secure, but can be disabled for development
// Set DB_SSL_REJECT_UNAUTHORIZED=false in .env for cloud providers with non-standard certs
const sslRejectUnauthorized =
  process.env.DB_SSL_REJECT_UNAUTHORIZED === "false"
    ? false
    : process.env.NODE_ENV === "production";

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: sslRejectUnauthorized,
  },
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🧹 Finding duplicate claims...\n");

  // Find all items that have multiple active claims in the same bubble
  const claims = await prisma.claim.findMany({
    where: {
      status: { in: ["CLAIMED", "PURCHASED"] },
    },
    orderBy: { claimedAt: "asc" },
    include: {
      item: { select: { title: true } },
      user: { select: { name: true, email: true } },
      bubble: { select: { name: true } },
    },
  });

  // Group claims by itemId + bubbleId
  const claimGroups = new Map<string, typeof claims>();
  for (const claim of claims) {
    const key = `${claim.itemId}-${claim.bubbleId}`;
    if (!claimGroups.has(key)) {
      claimGroups.set(key, []);
    }
    claimGroups.get(key)!.push(claim);
  }

  // Find groups with more than 1 claim (duplicates)
  const duplicateGroups = Array.from(claimGroups.entries()).filter(
    ([, group]) => group.length > 1
  );

  if (duplicateGroups.length === 0) {
    console.log("✅ No duplicate claims found!");
    return;
  }

  console.log(`Found ${duplicateGroups.length} items with duplicate claims:\n`);

  let totalDeleted = 0;

  for (const [, group] of duplicateGroups) {
    console.log(`\n📦 Item: ${group[0].item.title} (in ${group[0].bubble.name})`);
    console.log(`   Has ${group.length} claims:`);

    // Keep the first claim, delete the rest
    const [keep, ...toDelete] = group;

    console.log(`   ✓ Keeping: ${keep.user.name || keep.user.email} (${keep.status})`);

    for (const claim of toDelete) {
      console.log(`   ✗ Deleting: ${claim.user.name || claim.user.email} (${claim.status})`);
      await prisma.claim.delete({
        where: { id: claim.id },
      });
      totalDeleted++;
    }
  }

  console.log(`\n✅ Cleanup complete! Deleted ${totalDeleted} duplicate claims.`);
}

main()
  .catch((e) => {
    console.error("❌ Cleanup failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
