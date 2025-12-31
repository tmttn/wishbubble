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
      default:
        days = 30;
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get subscription stats
    const [
      activeSubscriptions,
      trialingSubscriptions,
      canceledSubscriptions,
      pastDueSubscriptions,
    ] = await Promise.all([
      prisma.subscription.count({ where: { status: "ACTIVE" } }),
      prisma.subscription.count({ where: { status: "TRIALING" } }),
      prisma.subscription.count({ where: { status: "CANCELED" } }),
      prisma.subscription.count({ where: { status: "PAST_DUE" } }),
    ]);

    // Get subscription tier breakdown
    const [premiumCount, familyCount] = await Promise.all([
      prisma.subscription.count({
        where: { status: { in: ["ACTIVE", "TRIALING"] }, tier: "PREMIUM" },
      }),
      prisma.subscription.count({
        where: { status: { in: ["ACTIVE", "TRIALING"] }, tier: "FAMILY" },
      }),
    ]);

    // Get revenue data
    const [
      thisMonthRevenue,
      lastMonthRevenue,
      totalRevenue,
      periodRevenue,
    ] = await Promise.all([
      prisma.transaction.aggregate({
        where: {
          status: "COMPLETED",
          type: "PAYMENT",
          completedAt: { gte: thisMonth },
        },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: {
          status: "COMPLETED",
          type: "PAYMENT",
          completedAt: { gte: lastMonth, lt: thisMonth },
        },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: {
          status: "COMPLETED",
          type: "PAYMENT",
        },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: {
          status: "COMPLETED",
          type: "PAYMENT",
          completedAt: { gte: startDate },
        },
        _sum: { amount: true },
      }),
    ]);

    // Get transaction counts
    const [successfulPayments, failedPayments, refunds] = await Promise.all([
      prisma.transaction.count({
        where: { status: "COMPLETED", type: "PAYMENT", completedAt: { gte: startDate } },
      }),
      prisma.transaction.count({
        where: { status: "FAILED", type: "PAYMENT", failedAt: { gte: startDate } },
      }),
      prisma.transaction.count({
        where: { status: "REFUNDED", completedAt: { gte: startDate } },
      }),
    ]);

    // Get new subscriptions in period
    const [newSubscriptions, canceledInPeriod] = await Promise.all([
      prisma.subscription.count({
        where: { createdAt: { gte: startDate } },
      }),
      prisma.subscription.count({
        where: { canceledAt: { gte: startDate } },
      }),
    ]);

    // Trial conversions
    const [trialsStarted, trialsConverted] = await Promise.all([
      prisma.subscription.count({
        where: {
          trialEndsAt: { not: null },
          createdAt: { gte: startDate },
        },
      }),
      prisma.subscription.count({
        where: {
          trialEndsAt: { not: null, lt: now },
          status: "ACTIVE",
          createdAt: { gte: startDate },
        },
      }),
    ]);

    // Coupon stats
    const [totalCoupons, activeCoupons, couponRedemptions] = await Promise.all([
      prisma.coupon.count(),
      prisma.coupon.count({ where: { isActive: true } }),
      prisma.couponRedemption.count({
        where: { redeemedAt: { gte: startDate } },
      }),
    ]);

    // Calculate MRR (simplified - assumes all active subscriptions are monthly)
    // In production, you'd need to account for yearly subscriptions
    const premiumMRR = premiumCount * 499; // €4.99 in cents
    const familyMRR = familyCount * 999; // €9.99 in cents
    const mrr = premiumMRR + familyMRR;
    const arr = mrr * 12;

    // Revenue growth chart data
    const revenueByDay = await prisma.transaction.groupBy({
      by: ["completedAt"],
      where: {
        status: "COMPLETED",
        type: "PAYMENT",
        completedAt: { gte: startDate },
      },
      _sum: { amount: true },
    });

    // Build daily revenue data
    const dailyRevenue: Record<string, number> = {};
    const currentDate = new Date(startDate);
    while (currentDate <= now) {
      const key = currentDate.toISOString().split("T")[0];
      dailyRevenue[key] = 0;
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // This needs transaction data with dates - simplified for now
    // In production, you'd use raw SQL or a different approach

    return NextResponse.json({
      subscriptions: {
        active: activeSubscriptions,
        trialing: trialingSubscriptions,
        canceled: canceledSubscriptions,
        pastDue: pastDueSubscriptions,
        total: activeSubscriptions + trialingSubscriptions,
      },
      tiers: {
        premium: premiumCount,
        family: familyCount,
      },
      revenue: {
        thisMonth: thisMonthRevenue._sum.amount || 0,
        lastMonth: lastMonthRevenue._sum.amount || 0,
        total: totalRevenue._sum.amount || 0,
        period: periodRevenue._sum.amount || 0,
        mrr,
        arr,
      },
      transactions: {
        successful: successfulPayments,
        failed: failedPayments,
        refunds,
      },
      growth: {
        newSubscriptions,
        canceled: canceledInPeriod,
        churnRate: activeSubscriptions > 0
          ? ((canceledInPeriod / activeSubscriptions) * 100).toFixed(1)
          : "0",
      },
      trials: {
        started: trialsStarted,
        converted: trialsConverted,
        conversionRate: trialsStarted > 0
          ? ((trialsConverted / trialsStarted) * 100).toFixed(1)
          : "0",
      },
      coupons: {
        total: totalCoupons,
        active: activeCoupons,
        redemptions: couponRedemptions,
      },
      period,
      days,
    });
  } catch (error) {
    console.error("Financial stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch financial stats" },
      { status: 500 }
    );
  }
}
