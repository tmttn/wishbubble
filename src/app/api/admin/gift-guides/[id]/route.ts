import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin";
import { z } from "zod";
import { logger } from "@/lib/logger";

const updateGiftGuideSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens")
    .optional(),
  titleEn: z.string().min(1).max(200).optional(),
  titleNl: z.string().min(1).max(200).optional(),
  descriptionEn: z.string().min(1).max(1000).optional(),
  descriptionNl: z.string().min(1).max(1000).optional(),
  contentEn: z.string().max(100000).optional(),
  contentNl: z.string().max(100000).optional(),
  keywordsEn: z.array(z.string()).optional(),
  keywordsNl: z.array(z.string()).optional(),
  category: z.enum(["occasion", "budget", "recipient"]).nullable().optional(),
  priceMin: z.number().positive().nullable().optional(),
  priceMax: z.number().positive().nullable().optional(),
  searchQuery: z.string().max(500).nullable().optional(),
  featuredImage: z.string().url().nullable().optional(),
  sortOrder: z.number().int().optional(),
  isPublished: z.boolean().optional(),
  publishedAt: z.string().datetime().nullable().optional(),
});

// GET /api/admin/gift-guides/[id] - Get single gift guide
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

    const guide = await prisma.giftGuide.findUnique({
      where: { id },
    });

    if (!guide) {
      return NextResponse.json(
        { error: "Gift guide not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...guide,
      priceMin: guide.priceMin ? Number(guide.priceMin) : null,
      priceMax: guide.priceMax ? Number(guide.priceMax) : null,
    });
  } catch (error) {
    logger.error("Error fetching gift guide", error);
    return NextResponse.json(
      { error: "Failed to fetch gift guide" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/gift-guides/[id] - Update gift guide
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
    const validation = updateGiftGuideSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if slug is being changed and if new slug already exists
    if (data.slug) {
      const existing = await prisma.giftGuide.findFirst({
        where: {
          slug: data.slug,
          NOT: { id },
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: "A gift guide with this slug already exists" },
          { status: 400 }
        );
      }
    }

    // Build update data object
    const updateData: Record<string, unknown> = {};

    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.titleEn !== undefined) updateData.titleEn = data.titleEn;
    if (data.titleNl !== undefined) updateData.titleNl = data.titleNl;
    if (data.descriptionEn !== undefined) updateData.descriptionEn = data.descriptionEn;
    if (data.descriptionNl !== undefined) updateData.descriptionNl = data.descriptionNl;
    if (data.contentEn !== undefined) updateData.contentEn = data.contentEn;
    if (data.contentNl !== undefined) updateData.contentNl = data.contentNl;
    if (data.keywordsEn !== undefined) updateData.keywordsEn = data.keywordsEn;
    if (data.keywordsNl !== undefined) updateData.keywordsNl = data.keywordsNl;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.priceMin !== undefined) updateData.priceMin = data.priceMin;
    if (data.priceMax !== undefined) updateData.priceMax = data.priceMax;
    if (data.searchQuery !== undefined) updateData.searchQuery = data.searchQuery;
    if (data.featuredImage !== undefined) updateData.featuredImage = data.featuredImage;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
    if (data.isPublished !== undefined) {
      updateData.isPublished = data.isPublished;
      // Auto-set publishedAt when publishing for the first time
      if (data.isPublished && data.publishedAt === undefined) {
        const current = await prisma.giftGuide.findUnique({
          where: { id },
          select: { publishedAt: true },
        });
        if (!current?.publishedAt) {
          updateData.publishedAt = new Date();
        }
      }
    }
    if (data.publishedAt !== undefined) {
      updateData.publishedAt = data.publishedAt ? new Date(data.publishedAt) : null;
    }

    const guide = await prisma.giftGuide.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      ...guide,
      priceMin: guide.priceMin ? Number(guide.priceMin) : null,
      priceMax: guide.priceMax ? Number(guide.priceMax) : null,
    });
  } catch (error) {
    logger.error("Error updating gift guide", error);
    return NextResponse.json(
      { error: "Failed to update gift guide" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/gift-guides/[id] - Delete gift guide
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

    await prisma.giftGuide.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error deleting gift guide", error);
    return NextResponse.json(
      { error: "Failed to delete gift guide" },
      { status: 500 }
    );
  }
}
