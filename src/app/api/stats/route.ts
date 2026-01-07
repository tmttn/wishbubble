import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { unstable_cache } from "next/cache";

// Cache stats for 1 hour to avoid hammering the database on every page load
const getPublicStats = unstable_cache(
  async () => {
    // During build phase, Prisma client is not available
    if (process.env.NEXT_PHASE === "phase-production-build") {
      return { users: 0, bubbles: 0, wishes: 0 };
    }

    const [userCount, bubbleCount, wishlistItemCount] = await Promise.all([
      prisma.user.count({
        where: { deletedAt: null },
      }),
      prisma.bubble.count({
        where: { archivedAt: null },
      }),
      prisma.wishlistItem.count({
        where: { deletedAt: null },
      }),
    ]);

    return {
      users: userCount,
      bubbles: bubbleCount,
      wishes: wishlistItemCount,
    };
  },
  ["public-stats"],
  { revalidate: 3600 } // Cache for 1 hour
);

export async function GET() {
  try {
    const stats = await getPublicStats();
    return NextResponse.json(stats);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
