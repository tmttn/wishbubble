import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin";
import { z } from "zod";
import { logger } from "@/lib/logger";

const createAnnouncementSchema = z.object({
  titleEn: z.string().min(1).max(200),
  titleNl: z.string().min(1).max(200),
  bodyEn: z.string().min(1).max(5000),
  bodyNl: z.string().min(1).max(5000),
  imageUrl: z.string().url().optional().nullable(),
  ctaLabel: z.string().max(50).optional().nullable(),
  ctaUrl: z.string().url().optional().nullable(),
  targetTiers: z.array(z.enum(["FREE", "PREMIUM", "FAMILY"])).default(["FREE", "PREMIUM", "FAMILY"]),
  publishedAt: z.string().datetime().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
  isActive: z.boolean().default(true),
});

// GET /api/admin/announcements - List all announcements
export async function GET() {
  try {
    const adminResult = await requireAdminApi();
    if (adminResult.error) {
      return NextResponse.json(
        { error: adminResult.error },
        { status: adminResult.status }
      );
    }

    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { dismissals: true },
        },
      },
    });

    return NextResponse.json(announcements);
  } catch (error) {
    logger.error("Error fetching announcements", error);
    return NextResponse.json(
      { error: "Failed to fetch announcements" },
      { status: 500 }
    );
  }
}

// POST /api/admin/announcements - Create a new announcement
export async function POST(request: Request) {
  try {
    const adminResult = await requireAdminApi();
    if (adminResult.error) {
      return NextResponse.json(
        { error: adminResult.error },
        { status: adminResult.status }
      );
    }

    const body = await request.json();
    const validation = createAnnouncementSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    const announcement = await prisma.announcement.create({
      data: {
        titleEn: data.titleEn,
        titleNl: data.titleNl,
        bodyEn: data.bodyEn,
        bodyNl: data.bodyNl,
        imageUrl: data.imageUrl,
        ctaLabel: data.ctaLabel,
        ctaUrl: data.ctaUrl,
        targetTiers: data.targetTiers,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : new Date(),
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        isActive: data.isActive,
      },
    });

    return NextResponse.json(announcement, { status: 201 });
  } catch (error) {
    logger.error("Error creating announcement", error);
    return NextResponse.json(
      { error: "Failed to create announcement" },
      { status: 500 }
    );
  }
}
