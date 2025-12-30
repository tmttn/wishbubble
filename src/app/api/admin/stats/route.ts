import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { prisma } from "@/lib/db";

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
    const period = searchParams.get("period") || "30d";
    const granularity = searchParams.get("granularity") || "day";

    // Calculate days based on period
    let days: number;
    switch (period) {
      case "7d":
        days = 7;
        break;
      case "30d":
        days = 30;
        break;
      case "90d":
        days = 90;
        break;
      case "1y":
        days = 365;
        break;
      case "2y":
        days = 730;
        break;
      case "all":
        days = 3650; // ~10 years
        break;
      default:
        days = 30;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // For YoY comparison, also get data from same period last year
    const lastYearStart = new Date(startDate);
    lastYearStart.setFullYear(lastYearStart.getFullYear() - 1);
    const lastYearEnd = new Date();
    lastYearEnd.setFullYear(lastYearEnd.getFullYear() - 1);

    // Get current period data
    const [users, groups, items, claims] = await Promise.all([
      prisma.user.findMany({
        where: {
          createdAt: { gte: startDate },
          deletedAt: null,
        },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.bubble.findMany({
        where: {
          createdAt: { gte: startDate },
          archivedAt: null,
        },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.wishlistItem.findMany({
        where: {
          createdAt: { gte: startDate },
          deletedAt: null,
        },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.claim.findMany({
        where: {
          claimedAt: { gte: startDate },
        },
        select: { claimedAt: true },
        orderBy: { claimedAt: "asc" },
      }),
    ]);

    // Get last year's data for YoY comparison
    const [usersLastYear, groupsLastYear, itemsLastYear, claimsLastYear] =
      await Promise.all([
        prisma.user.findMany({
          where: {
            createdAt: { gte: lastYearStart, lte: lastYearEnd },
            deletedAt: null,
          },
          select: { createdAt: true },
          orderBy: { createdAt: "asc" },
        }),
        prisma.bubble.findMany({
          where: {
            createdAt: { gte: lastYearStart, lte: lastYearEnd },
            archivedAt: null,
          },
          select: { createdAt: true },
          orderBy: { createdAt: "asc" },
        }),
        prisma.wishlistItem.findMany({
          where: {
            createdAt: { gte: lastYearStart, lte: lastYearEnd },
            deletedAt: null,
          },
          select: { createdAt: true },
          orderBy: { createdAt: "asc" },
        }),
        prisma.claim.findMany({
          where: {
            claimedAt: { gte: lastYearStart, lte: lastYearEnd },
          },
          select: { claimedAt: true },
          orderBy: { claimedAt: "asc" },
        }),
      ]);

    // Get totals before the period for cumulative counts
    const [totalUsersBefore, totalGroupsBefore, totalItemsBefore, totalClaimsBefore] =
      await Promise.all([
        prisma.user.count({
          where: { createdAt: { lt: startDate }, deletedAt: null },
        }),
        prisma.bubble.count({
          where: { createdAt: { lt: startDate }, archivedAt: null },
        }),
        prisma.wishlistItem.count({
          where: { createdAt: { lt: startDate }, deletedAt: null },
        }),
        prisma.claim.count({
          where: { claimedAt: { lt: startDate } },
        }),
      ]);

    // Get totals before last year's period
    const [totalUsersBeforeLastYear, totalGroupsBeforeLastYear, totalItemsBeforeLastYear, totalClaimsBeforeLastYear] =
      await Promise.all([
        prisma.user.count({
          where: { createdAt: { lt: lastYearStart }, deletedAt: null },
        }),
        prisma.bubble.count({
          where: { createdAt: { lt: lastYearStart }, archivedAt: null },
        }),
        prisma.wishlistItem.count({
          where: { createdAt: { lt: lastYearStart }, deletedAt: null },
        }),
        prisma.claim.count({
          where: { claimedAt: { lt: lastYearStart } },
        }),
      ]);

    // Build data based on granularity
    const formatDate = (date: Date, gran: string): string => {
      if (gran === "week") {
        // Get start of week (Sunday)
        const d = new Date(date);
        d.setDate(d.getDate() - d.getDay());
        return d.toISOString().split("T")[0];
      } else if (gran === "month") {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      }
      return date.toISOString().split("T")[0];
    };

    const getDisplayDate = (dateStr: string, gran: string): string => {
      if (gran === "month") {
        const [year, month] = dateStr.split("-");
        return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString("en-US", {
          month: "short",
          year: days > 365 ? "2-digit" : undefined,
        });
      } else if (gran === "week") {
        return new Date(dateStr).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      }
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    };

    // Determine best granularity based on period
    const effectiveGranularity = granularity === "auto"
      ? days <= 30 ? "day" : days <= 90 ? "week" : "month"
      : granularity;

    // Build period data
    const periodData: Record<string, { users: number; groups: number; items: number; claims: number }> = {};

    // Initialize all periods
    const currentDate = new Date(startDate);
    while (currentDate <= new Date()) {
      const key = formatDate(currentDate, effectiveGranularity);
      if (!periodData[key]) {
        periodData[key] = { users: 0, groups: 0, items: 0, claims: 0 };
      }
      if (effectiveGranularity === "month") {
        currentDate.setMonth(currentDate.getMonth() + 1);
      } else if (effectiveGranularity === "week") {
        currentDate.setDate(currentDate.getDate() + 7);
      } else {
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    // Count additions
    users.forEach((u) => {
      const key = formatDate(u.createdAt, effectiveGranularity);
      if (periodData[key]) periodData[key].users++;
    });
    groups.forEach((g) => {
      const key = formatDate(g.createdAt, effectiveGranularity);
      if (periodData[key]) periodData[key].groups++;
    });
    items.forEach((i) => {
      const key = formatDate(i.createdAt, effectiveGranularity);
      if (periodData[key]) periodData[key].items++;
    });
    claims.forEach((c) => {
      const key = formatDate(c.claimedAt, effectiveGranularity);
      if (periodData[key]) periodData[key].claims++;
    });

    // Build last year's period data for YoY
    const lastYearData: Record<string, { users: number; groups: number; items: number; claims: number }> = {};

    const lastYearCurrentDate = new Date(lastYearStart);
    while (lastYearCurrentDate <= lastYearEnd) {
      const key = formatDate(lastYearCurrentDate, effectiveGranularity);
      if (!lastYearData[key]) {
        lastYearData[key] = { users: 0, groups: 0, items: 0, claims: 0 };
      }
      if (effectiveGranularity === "month") {
        lastYearCurrentDate.setMonth(lastYearCurrentDate.getMonth() + 1);
      } else if (effectiveGranularity === "week") {
        lastYearCurrentDate.setDate(lastYearCurrentDate.getDate() + 7);
      } else {
        lastYearCurrentDate.setDate(lastYearCurrentDate.getDate() + 1);
      }
    }

    usersLastYear.forEach((u) => {
      const key = formatDate(u.createdAt, effectiveGranularity);
      if (lastYearData[key]) lastYearData[key].users++;
    });
    groupsLastYear.forEach((g) => {
      const key = formatDate(g.createdAt, effectiveGranularity);
      if (lastYearData[key]) lastYearData[key].groups++;
    });
    itemsLastYear.forEach((i) => {
      const key = formatDate(i.createdAt, effectiveGranularity);
      if (lastYearData[key]) lastYearData[key].items++;
    });
    claimsLastYear.forEach((c) => {
      const key = formatDate(c.claimedAt, effectiveGranularity);
      if (lastYearData[key]) lastYearData[key].claims++;
    });

    // Convert to cumulative data
    let cumulativeUsers = totalUsersBefore;
    let cumulativeGroups = totalGroupsBefore;
    let cumulativeItems = totalItemsBefore;
    let cumulativeClaims = totalClaimsBefore;

    const growthData = Object.entries(periodData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateKey, counts]) => {
        cumulativeUsers += counts.users;
        cumulativeGroups += counts.groups;
        cumulativeItems += counts.items;
        cumulativeClaims += counts.claims;

        return {
          date: getDisplayDate(dateKey, effectiveGranularity),
          dateKey,
          users: cumulativeUsers,
          groups: cumulativeGroups,
          items: cumulativeItems,
          claims: cumulativeClaims,
          newUsers: counts.users,
          newGroups: counts.groups,
          newItems: counts.items,
          newClaims: counts.claims,
        };
      });

    // Convert last year data to cumulative
    let cumulativeUsersLastYear = totalUsersBeforeLastYear;
    let cumulativeGroupsLastYear = totalGroupsBeforeLastYear;
    let cumulativeItemsLastYear = totalItemsBeforeLastYear;
    let cumulativeClaimsLastYear = totalClaimsBeforeLastYear;

    const lastYearGrowthData = Object.entries(lastYearData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateKey, counts]) => {
        cumulativeUsersLastYear += counts.users;
        cumulativeGroupsLastYear += counts.groups;
        cumulativeItemsLastYear += counts.items;
        cumulativeClaimsLastYear += counts.claims;

        return {
          date: getDisplayDate(dateKey, effectiveGranularity),
          dateKey,
          users: cumulativeUsersLastYear,
          groups: cumulativeGroupsLastYear,
          items: cumulativeItemsLastYear,
          claims: cumulativeClaimsLastYear,
          newUsers: counts.users,
          newGroups: counts.groups,
          newItems: counts.items,
          newClaims: counts.claims,
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

    // Get this month's stats
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);

    const [monthUsers, monthGroups, monthClaims] = await Promise.all([
      prisma.user.count({
        where: { createdAt: { gte: monthAgo }, deletedAt: null },
      }),
      prisma.bubble.count({
        where: { createdAt: { gte: monthAgo }, archivedAt: null },
      }),
      prisma.claim.count({
        where: { claimedAt: { gte: monthAgo } },
      }),
    ]);

    // YoY comparison stats
    const lastYearToday = new Date(today);
    lastYearToday.setFullYear(lastYearToday.getFullYear() - 1);
    const lastYearTodayEnd = new Date(today);
    lastYearTodayEnd.setFullYear(lastYearTodayEnd.getFullYear() - 1);
    lastYearTodayEnd.setDate(lastYearTodayEnd.getDate() + 1);

    const lastYearMonthStart = new Date(monthAgo);
    lastYearMonthStart.setFullYear(lastYearMonthStart.getFullYear() - 1);
    const lastYearMonthEnd = new Date(today);
    lastYearMonthEnd.setFullYear(lastYearMonthEnd.getFullYear() - 1);

    const [lastYearMonthUsers, lastYearMonthGroups, lastYearMonthClaims] = await Promise.all([
      prisma.user.count({
        where: { createdAt: { gte: lastYearMonthStart, lte: lastYearMonthEnd }, deletedAt: null },
      }),
      prisma.bubble.count({
        where: { createdAt: { gte: lastYearMonthStart, lte: lastYearMonthEnd }, archivedAt: null },
      }),
      prisma.claim.count({
        where: { claimedAt: { gte: lastYearMonthStart, lte: lastYearMonthEnd } },
      }),
    ]);

    // Calculate period totals for current and last year
    const periodTotals = {
      users: users.length,
      groups: groups.length,
      items: items.length,
      claims: claims.length,
    };

    const lastYearPeriodTotals = {
      users: usersLastYear.length,
      groups: groupsLastYear.length,
      items: itemsLastYear.length,
      claims: claimsLastYear.length,
    };

    return NextResponse.json({
      growthData,
      lastYearGrowthData,
      period,
      granularity: effectiveGranularity,
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
      month: {
        users: monthUsers,
        groups: monthGroups,
        claims: monthClaims,
      },
      periodTotals,
      lastYearPeriodTotals,
      yoy: {
        users: lastYearMonthUsers > 0 ? ((monthUsers - lastYearMonthUsers) / lastYearMonthUsers * 100).toFixed(1) : null,
        groups: lastYearMonthGroups > 0 ? ((monthGroups - lastYearMonthGroups) / lastYearMonthGroups * 100).toFixed(1) : null,
        claims: lastYearMonthClaims > 0 ? ((monthClaims - lastYearMonthClaims) / lastYearMonthClaims * 100).toFixed(1) : null,
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
