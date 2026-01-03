import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

// GET /api/release-notes - Get public release notes (no auth required)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const now = new Date();

    // Fetch release notes that are:
    // - marked as isReleaseNote = true
    // - active
    // - published (publishedAt <= now)
    // - not expired (expiresAt is null or > now)
    const where = {
      isReleaseNote: true,
      isActive: true,
      publishedAt: { lte: now },
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: now } },
      ],
    };

    const [releaseNotes, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        take: limit,
        skip: offset,
        select: {
          id: true,
          titleEn: true,
          titleNl: true,
          bodyEn: true,
          bodyNl: true,
          imageUrl: true,
          ctaLabel: true,
          ctaUrl: true,
          publishedAt: true,
        },
      }),
      prisma.announcement.count({ where }),
    ]);

    return NextResponse.json({
      releaseNotes,
      total,
      hasMore: offset + releaseNotes.length < total,
    });
  } catch (error) {
    logger.error("Error fetching release notes", error);
    return NextResponse.json(
      { error: "Failed to fetch release notes" },
      { status: 500 }
    );
  }
}
