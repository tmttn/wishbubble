import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { USER_JOURNEYS } from "@/lib/journeys";

export async function GET(request: Request) {
  const authResult = await requireAdminApi();
  if (authResult.error) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "7d";

    // Calculate date range
    let days: number;
    switch (period) {
      case "24h":
        days = 1;
        break;
      case "7d":
        days = 7;
        break;
      case "30d":
        days = 30;
        break;
      case "90d":
        days = 90;
        break;
      default:
        days = 7;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all analytics data in parallel
    const [
      // Event counts
      totalEvents,
      eventsByCategory,
      eventsByPage,
      eventsByDevice,
      recentEvents,
      // Journey data
      journeyStats,
      // Time series data
      eventsOverTime,
      // Active users
      uniqueSessions,
      uniqueUsers,
    ] = await Promise.all([
      // Total events
      prisma.userEvent.count({
        where: { createdAt: { gte: startDate } },
      }),

      // Events by category
      prisma.userEvent.groupBy({
        by: ["category"],
        where: { createdAt: { gte: startDate } },
        _count: true,
        orderBy: { _count: { category: "desc" } },
      }),

      // Top pages
      prisma.userEvent.groupBy({
        by: ["page"],
        where: {
          createdAt: { gte: startDate },
          action: "pageview",
        },
        _count: true,
        orderBy: { _count: { page: "desc" } },
        take: 10,
      }),

      // Events by device
      prisma.userEvent.groupBy({
        by: ["deviceType"],
        where: {
          createdAt: { gte: startDate },
          deviceType: { not: null },
        },
        _count: true,
      }),

      // Recent events (last 50)
      prisma.userEvent.findMany({
        where: { createdAt: { gte: startDate } },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          category: true,
          action: true,
          label: true,
          page: true,
          deviceType: true,
          createdAt: true,
        },
      }),

      // Journey stats
      prisma.userJourney.groupBy({
        by: ["journeyType", "status"],
        where: { startedAt: { gte: startDate } },
        _count: true,
      }),

      // Events over time (group by day or hour depending on period)
      prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
        SELECT
          ${days <= 1 ? prisma.$queryRaw`TO_CHAR("createdAt", 'HH24:00')` : prisma.$queryRaw`TO_CHAR("createdAt", 'YYYY-MM-DD')`} as date,
          COUNT(*) as count
        FROM "UserEvent"
        WHERE "createdAt" >= ${startDate}
        GROUP BY date
        ORDER BY date ASC
      `.catch(() => []),

      // Unique sessions
      prisma.userEvent.findMany({
        where: { createdAt: { gte: startDate } },
        distinct: ["sessionId"],
        select: { sessionId: true },
      }),

      // Unique users
      prisma.userEvent.findMany({
        where: {
          createdAt: { gte: startDate },
          userId: { not: null },
        },
        distinct: ["userId"],
        select: { userId: true },
      }),
    ]);

    // Process journey data into funnel format
    const journeyFunnels = Object.entries(USER_JOURNEYS).map(([key, journey]) => {
      const journeyData = journeyStats.filter((j) => j.journeyType === key);
      const inProgress = journeyData.find((j) => j.status === "IN_PROGRESS")?._count || 0;
      const completed = journeyData.find((j) => j.status === "COMPLETED")?._count || 0;
      const abandoned = journeyData.find((j) => j.status === "ABANDONED")?._count || 0;
      const total = inProgress + completed + abandoned;

      return {
        id: key,
        name: journey.name,
        total,
        inProgress,
        completed,
        abandoned,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    });

    // Format events over time
    const eventsTimeSeries = Array.isArray(eventsOverTime)
      ? eventsOverTime.map((row) => ({
          date: row.date,
          count: Number(row.count),
        }))
      : [];

    // Calculate category distribution for pie chart
    const categoryData = eventsByCategory.map((c) => ({
      name: c.category,
      value: c._count,
    }));

    // Calculate device distribution
    const deviceData = eventsByDevice.map((d) => ({
      name: d.deviceType || "unknown",
      value: d._count,
    }));

    return NextResponse.json({
      period,
      summary: {
        totalEvents,
        uniqueSessions: uniqueSessions.length,
        uniqueUsers: uniqueUsers.length,
        avgEventsPerSession:
          uniqueSessions.length > 0
            ? Math.round(totalEvents / uniqueSessions.length)
            : 0,
      },
      categoryData,
      deviceData,
      topPages: eventsByPage.map((p) => ({
        page: p.page,
        views: p._count,
      })),
      eventsTimeSeries,
      journeyFunnels,
      recentEvents: recentEvents.map((e) => ({
        ...e,
        createdAt: e.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    logger.error("Admin analytics error", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
