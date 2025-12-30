import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { prisma } from "@/lib/db";

export async function GET() {
  const authResult = await requireAdminApi();
  if (authResult.error) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  try {
    // Get daily growth data for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all users created in the last 30 days grouped by date
    const users = await prisma.user.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        deletedAt: null,
      },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    const groups = await prisma.bubble.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        archivedAt: null,
      },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    const items = await prisma.wishlistItem.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        deletedAt: null,
      },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    const claims = await prisma.claim.findMany({
      where: {
        claimedAt: { gte: thirtyDaysAgo },
      },
      select: { claimedAt: true },
      orderBy: { claimedAt: "asc" },
    });

    // Get totals before the 30-day period for cumulative counts
    const [totalUsersBefore, totalGroupsBefore, totalItemsBefore, totalClaimsBefore] =
      await Promise.all([
        prisma.user.count({
          where: { createdAt: { lt: thirtyDaysAgo }, deletedAt: null },
        }),
        prisma.bubble.count({
          where: { createdAt: { lt: thirtyDaysAgo }, archivedAt: null },
        }),
        prisma.wishlistItem.count({
          where: { createdAt: { lt: thirtyDaysAgo }, deletedAt: null },
        }),
        prisma.claim.count({
          where: { claimedAt: { lt: thirtyDaysAgo } },
        }),
      ]);

    // Build daily data
    const dailyData: Record<
      string,
      { users: number; groups: number; items: number; claims: number }
    > = {};

    // Initialize all days
    for (let i = 0; i < 30; i++) {
      const date = new Date(thirtyDaysAgo);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];
      dailyData[dateStr] = { users: 0, groups: 0, items: 0, claims: 0 };
    }

    // Count daily additions
    users.forEach((u) => {
      const dateStr = u.createdAt.toISOString().split("T")[0];
      if (dailyData[dateStr]) dailyData[dateStr].users++;
    });

    groups.forEach((g) => {
      const dateStr = g.createdAt.toISOString().split("T")[0];
      if (dailyData[dateStr]) dailyData[dateStr].groups++;
    });

    items.forEach((i) => {
      const dateStr = i.createdAt.toISOString().split("T")[0];
      if (dailyData[dateStr]) dailyData[dateStr].items++;
    });

    claims.forEach((c) => {
      const dateStr = c.claimedAt.toISOString().split("T")[0];
      if (dailyData[dateStr]) dailyData[dateStr].claims++;
    });

    // Convert to cumulative data
    let cumulativeUsers = totalUsersBefore;
    let cumulativeGroups = totalGroupsBefore;
    let cumulativeItems = totalItemsBefore;
    let cumulativeClaims = totalClaimsBefore;

    const growthData = Object.entries(dailyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => {
        cumulativeUsers += counts.users;
        cumulativeGroups += counts.groups;
        cumulativeItems += counts.items;
        cumulativeClaims += counts.claims;

        return {
          date: new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          users: cumulativeUsers,
          groups: cumulativeGroups,
          items: cumulativeItems,
          claims: cumulativeClaims,
        };
      });

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayUsers, todayGroups, todayClaims] = await Promise.all([
      prisma.user.count({
        where: { createdAt: { gte: today }, deletedAt: null },
      }),
      prisma.bubble.count({
        where: { createdAt: { gte: today }, archivedAt: null },
      }),
      prisma.claim.count({
        where: { claimedAt: { gte: today } },
      }),
    ]);

    // Get this week's stats
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [weekUsers, weekGroups, weekClaims] = await Promise.all([
      prisma.user.count({
        where: { createdAt: { gte: weekAgo }, deletedAt: null },
      }),
      prisma.bubble.count({
        where: { createdAt: { gte: weekAgo }, archivedAt: null },
      }),
      prisma.claim.count({
        where: { claimedAt: { gte: weekAgo } },
      }),
    ]);

    return NextResponse.json({
      growthData,
      today: {
        users: todayUsers,
        groups: todayGroups,
        claims: todayClaims,
      },
      week: {
        users: weekUsers,
        groups: weekGroups,
        claims: weekClaims,
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
