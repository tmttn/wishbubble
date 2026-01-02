import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin";
import { z } from "zod";
import { logger } from "@/lib/logger";

const updateAnnouncementSchema = z.object({
  titleEn: z.string().min(1).max(200).optional(),
  titleNl: z.string().min(1).max(200).optional(),
  bodyEn: z.string().min(1).max(5000).optional(),
  bodyNl: z.string().min(1).max(5000).optional(),
  imageUrl: z.string().url().optional().nullable(),
  ctaLabel: z.string().max(50).optional().nullable(),
  ctaUrl: z.string().url().optional().nullable(),
  targetTiers: z.array(z.enum(["FREE", "PREMIUM", "FAMILY"])).optional(),
  publishedAt: z.string().datetime().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
  isActive: z.boolean().optional(),
});

// GET /api/admin/announcements/[id] - Get single announcement
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminResult = await requireAdminApi();
    if (adminResult.error) {
      return NextResponse.json(
        { error: adminResult.error },
        { status: adminResult.status }
      );
    }

    const { id } = await params;

    const announcement = await prisma.announcement.findUnique({
      where: { id },
      include: {
        _count: {
          select: { dismissals: true },
        },
      },
    });

    if (!announcement) {
      return NextResponse.json(
        { error: "Announcement not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(announcement);
  } catch (error) {
    logger.error("Error fetching announcement", error);
    return NextResponse.json(
      { error: "Failed to fetch announcement" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/announcements/[id] - Update announcement
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminResult = await requireAdminApi();
    if (adminResult.error) {
      return NextResponse.json(
        { error: adminResult.error },
        { status: adminResult.status }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validation = updateAnnouncementSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    const announcement = await prisma.announcement.update({
      where: { id },
      data: {
        ...(data.titleEn !== undefined && { titleEn: data.titleEn }),
        ...(data.titleNl !== undefined && { titleNl: data.titleNl }),
        ...(data.bodyEn !== undefined && { bodyEn: data.bodyEn }),
        ...(data.bodyNl !== undefined && { bodyNl: data.bodyNl }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.ctaLabel !== undefined && { ctaLabel: data.ctaLabel }),
        ...(data.ctaUrl !== undefined && { ctaUrl: data.ctaUrl }),
        ...(data.targetTiers !== undefined && { targetTiers: data.targetTiers }),
        ...(data.publishedAt !== undefined && {
          publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
        }),
        ...(data.expiresAt !== undefined && {
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    return NextResponse.json(announcement);
  } catch (error) {
    logger.error("Error updating announcement", error);
    return NextResponse.json(
      { error: "Failed to update announcement" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/announcements/[id] - Delete announcement
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminResult = await requireAdminApi();
    if (adminResult.error) {
      return NextResponse.json(
        { error: adminResult.error },
        { status: adminResult.status }
      );
    }

    const { id } = await params;

    await prisma.announcement.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error deleting announcement", error);
    return NextResponse.json(
      { error: "Failed to delete announcement" },
      { status: 500 }
    );
  }
}
