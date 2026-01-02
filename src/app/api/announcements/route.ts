import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

// GET /api/announcements - Get announcements for current user
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Get user's subscription tier
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { subscriptionTier: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const now = new Date();

    // Build the where clause for active, published, non-expired announcements
    // that target the user's subscription tier
    const baseWhere = {
      isActive: true,
      publishedAt: { lte: now },
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: now } },
      ],
      targetTiers: { has: user.subscriptionTier },
    };

    // If unreadOnly, exclude dismissed announcements
    const dismissedIds = unreadOnly
      ? (
          await prisma.announcementDismissal.findMany({
            where: { userId: session.user.id },
            select: { announcementId: true },
          })
        ).map((d) => d.announcementId)
      : [];

    const where = unreadOnly
      ? {
          ...baseWhere,
          id: { notIn: dismissedIds },
        }
      : baseWhere;

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.announcement.count({ where }),
    ]);

    // Get user's dismissed announcement IDs for this set
    const announcementIds = announcements.map((a) => a.id);
    const userDismissals = await prisma.announcementDismissal.findMany({
      where: {
        userId: session.user.id,
        announcementId: { in: announcementIds },
      },
      select: { announcementId: true },
    });
    const dismissedSet = new Set(userDismissals.map((d) => d.announcementId));

    // Add isDismissed flag to each announcement
    const announcementsWithStatus = announcements.map((announcement) => ({
      ...announcement,
      isDismissed: dismissedSet.has(announcement.id),
    }));

    return NextResponse.json({
      announcements: announcementsWithStatus,
      total,
      hasMore: offset + announcements.length < total,
    });
  } catch (error) {
    logger.error("Error fetching announcements", error);
    return NextResponse.json(
      { error: "Failed to fetch announcements" },
      { status: 500 }
    );
  }
}
