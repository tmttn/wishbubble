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

    // Previous period for comparison
    const prevStartDate = new Date();
    prevStartDate.setDate(prevStartDate.getDate() - days * 2);
    const prevEndDate = new Date();
    prevEndDate.setDate(prevEndDate.getDate() - days);

    // Base filter to exclude admin pages from analytics
    const excludeAdminFilter = {
      NOT: {
        page: { startsWith: "/admin" },
      },
    };

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
      // UTM data
      utmSources,
      utmMediums,
      utmCampaigns,
      // Referrer data
      referrerData,
      // Previous period data for comparison
      prevTotalEvents,
      prevUniqueSessions,
      prevUniqueUsers,
    ] = await Promise.all([
      // Total events (excluding admin pages)
      prisma.userEvent.count({
        where: { createdAt: { gte: startDate }, ...excludeAdminFilter },
      }),

      // Events by category (excluding admin pages)
      prisma.userEvent.groupBy({
        by: ["category"],
        where: { createdAt: { gte: startDate }, ...excludeAdminFilter },
        _count: true,
        orderBy: { _count: { category: "desc" } },
      }),

      // Top pages (excluding admin pages)
      prisma.userEvent.groupBy({
        by: ["page"],
        where: {
          createdAt: { gte: startDate },
          action: "pageview",
          ...excludeAdminFilter,
        },
        _count: true,
        orderBy: { _count: { page: "desc" } },
        take: 10,
      }),

      // Events by device (excluding admin pages)
      prisma.userEvent.groupBy({
        by: ["deviceType"],
        where: {
          createdAt: { gte: startDate },
          deviceType: { not: null },
          ...excludeAdminFilter,
        },
        _count: true,
      }),

      // Recent events (last 50, excluding admin pages)
      prisma.userEvent.findMany({
        where: { createdAt: { gte: startDate }, ...excludeAdminFilter },
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
          // Additional fields for detailed view
          referrer: true,
          sessionId: true,
          utmSource: true,
          utmMedium: true,
          utmCampaign: true,
          utmContent: true,
          utmTerm: true,
          value: true,
        },
      }),

      // Journey stats
      prisma.userJourney.groupBy({
        by: ["journeyType", "status"],
        where: { startedAt: { gte: startDate } },
        _count: true,
      }),

      // Events over time (group by day or hour depending on period, excluding admin pages)
      (days <= 1
        ? prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
            SELECT
              TO_CHAR("createdAt", 'HH24:00') as date,
              COUNT(*) as count
            FROM "UserEvent"
            WHERE "createdAt" >= ${startDate}
              AND "page" NOT LIKE '/admin%'
            GROUP BY TO_CHAR("createdAt", 'HH24:00')
            ORDER BY date ASC
          `
        : prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
            SELECT
              TO_CHAR("createdAt", 'YYYY-MM-DD') as date,
              COUNT(*) as count
            FROM "UserEvent"
            WHERE "createdAt" >= ${startDate}
              AND "page" NOT LIKE '/admin%'
            GROUP BY TO_CHAR("createdAt", 'YYYY-MM-DD')
            ORDER BY date ASC
          `
      ).catch(() => []),

      // Unique sessions (excluding admin pages)
      prisma.userEvent.findMany({
        where: { createdAt: { gte: startDate }, ...excludeAdminFilter },
        distinct: ["sessionId"],
        select: { sessionId: true },
      }),

      // Unique users (excluding admin pages)
      prisma.userEvent.findMany({
        where: {
          createdAt: { gte: startDate },
          userId: { not: null },
          ...excludeAdminFilter,
        },
        distinct: ["userId"],
        select: { userId: true },
      }),

      // UTM Sources (excluding admin pages)
      prisma.userEvent.groupBy({
        by: ["utmSource"],
        where: {
          createdAt: { gte: startDate },
          utmSource: { not: null },
          ...excludeAdminFilter,
        },
        _count: true,
        orderBy: { _count: { utmSource: "desc" } },
        take: 10,
      }),

      // UTM Mediums (excluding admin pages)
      prisma.userEvent.groupBy({
        by: ["utmMedium"],
        where: {
          createdAt: { gte: startDate },
          utmMedium: { not: null },
          ...excludeAdminFilter,
        },
        _count: true,
        orderBy: { _count: { utmMedium: "desc" } },
        take: 10,
      }),

      // UTM Campaigns (excluding admin pages)
      prisma.userEvent.groupBy({
        by: ["utmCampaign"],
        where: {
          createdAt: { gte: startDate },
          utmCampaign: { not: null },
          ...excludeAdminFilter,
        },
        _count: true,
        orderBy: { _count: { utmCampaign: "desc" } },
        take: 10,
      }),

      // Referrer breakdown (excluding admin pages)
      prisma.userEvent.groupBy({
        by: ["referrer"],
        where: {
          createdAt: { gte: startDate },
          referrer: { not: null },
          action: "pageview",
          ...excludeAdminFilter,
        },
        _count: true,
        orderBy: { _count: { referrer: "desc" } },
        take: 10,
      }),

      // Previous period - total events
      prisma.userEvent.count({
        where: {
          createdAt: { gte: prevStartDate, lt: prevEndDate },
          ...excludeAdminFilter,
        },
      }),

      // Previous period - unique sessions
      prisma.userEvent.findMany({
        where: {
          createdAt: { gte: prevStartDate, lt: prevEndDate },
          ...excludeAdminFilter,
        },
        distinct: ["sessionId"],
        select: { sessionId: true },
      }),

      // Previous period - unique users
      prisma.userEvent.findMany({
        where: {
          createdAt: { gte: prevStartDate, lt: prevEndDate },
          userId: { not: null },
          ...excludeAdminFilter,
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

    // Process UTM data
    const utmSourceData = utmSources.map((s) => ({
      name: s.utmSource || "unknown",
      value: s._count,
    }));

    const utmMediumData = utmMediums.map((m) => ({
      name: m.utmMedium || "unknown",
      value: m._count,
    }));

    const utmCampaignData = utmCampaigns.map((c) => ({
      name: c.utmCampaign || "unknown",
      value: c._count,
    }));

    // Process referrer data - categorize into sources
    // Exclude own domain from referrers (internal navigation shouldn't count)
    const ownDomains = ["wish-bubble.app", "www.wish-bubble.app"];
    const processedReferrers = referrerData
      .filter((r) => r.referrer && r.referrer.length > 0)
      .filter((r) => {
        try {
          const url = new URL(r.referrer!);
          const hostname = url.hostname.toLowerCase();
          return !ownDomains.includes(hostname);
        } catch {
          return true;
        }
      })
      .map((r) => {
        let name = "Direct";
        try {
          const url = new URL(r.referrer!);
          name = url.hostname.replace("www.", "");
        } catch {
          name = r.referrer!.substring(0, 30);
        }
        return { name, value: r._count };
      })
      // Combine same hostnames
      .reduce(
        (acc, curr) => {
          const existing = acc.find((a) => a.name === curr.name);
          if (existing) {
            existing.value += curr.value;
          } else {
            acc.push(curr);
          }
          return acc;
        },
        [] as Array<{ name: string; value: number }>
      )
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Calculate comparison percentages
    const calcChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const currentSessions = uniqueSessions.length;
    const currentUsers = uniqueUsers.length;
    const prevSessionCount = prevUniqueSessions.length;
    const prevUserCount = prevUniqueUsers.length;

    return NextResponse.json({
      period,
      summary: {
        totalEvents,
        uniqueSessions: currentSessions,
        uniqueUsers: currentUsers,
        avgEventsPerSession:
          currentSessions > 0 ? Math.round(totalEvents / currentSessions) : 0,
        // Comparison with previous period
        comparison: {
          events: calcChange(totalEvents, prevTotalEvents),
          sessions: calcChange(currentSessions, prevSessionCount),
          users: calcChange(currentUsers, prevUserCount),
        },
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
      utmData: {
        sources: utmSourceData,
        mediums: utmMediumData,
        campaigns: utmCampaignData,
      },
      referrers: processedReferrers,
    });
  } catch (error) {
    logger.error("Admin analytics error", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
