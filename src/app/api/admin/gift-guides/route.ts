import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin";
import { z } from "zod";
import { logger } from "@/lib/logger";

const createGiftGuideSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  titleEn: z.string().min(1).max(200),
  titleNl: z.string().min(1).max(200),
  descriptionEn: z.string().min(1).max(1000),
  descriptionNl: z.string().min(1).max(1000),
  contentEn: z.string().max(100000).default(""),
  contentNl: z.string().max(100000).default(""),
  keywordsEn: z.array(z.string()).default([]),
  keywordsNl: z.array(z.string()).default([]),
  category: z.enum(["occasion", "budget", "recipient"]).nullable().optional(),
  priceMin: z.number().positive().nullable().optional(),
  priceMax: z.number().positive().nullable().optional(),
  searchQuery: z.string().max(500).nullable().optional(),
  featuredImage: z.string().url().nullable().optional(),
  sortOrder: z.number().int().default(0),
  isPublished: z.boolean().default(false),
  publishedAt: z.string().datetime().nullable().optional(),
});

// GET /api/admin/gift-guides - List all gift guides (admin view includes unpublished)
export async function GET() {
  try {
    const adminResult = await requireAdminApi();
    if (adminResult.error) {
      return NextResponse.json(
        { error: adminResult.error },
        { status: adminResult.status }
      );
    }

    const guides = await prisma.giftGuide.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        slug: true,
        titleEn: true,
        titleNl: true,
        descriptionEn: true,
        descriptionNl: true,
        contentEn: true,
        contentNl: true,
        keywordsEn: true,
        keywordsNl: true,
        category: true,
        priceMin: true,
        priceMax: true,
        searchQuery: true,
        featuredImage: true,
        sortOrder: true,
        isPublished: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Convert Decimal fields to numbers
    const guidesWithNumbers = guides.map((guide) => ({
      ...guide,
      priceMin: guide.priceMin ? Number(guide.priceMin) : null,
      priceMax: guide.priceMax ? Number(guide.priceMax) : null,
    }));

    return NextResponse.json(guidesWithNumbers);
  } catch (error) {
    logger.error("Error fetching gift guides", error);
    return NextResponse.json(
      { error: "Failed to fetch gift guides" },
      { status: 500 }
    );
  }
}

// POST /api/admin/gift-guides - Create a new gift guide
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
    const validation = createGiftGuideSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if slug already exists
    const existing = await prisma.giftGuide.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A gift guide with this slug already exists" },
        { status: 400 }
      );
    }

    const guide = await prisma.giftGuide.create({
      data: {
        slug: data.slug,
        titleEn: data.titleEn,
        titleNl: data.titleNl,
        descriptionEn: data.descriptionEn,
        descriptionNl: data.descriptionNl,
        contentEn: data.contentEn,
        contentNl: data.contentNl,
        keywordsEn: data.keywordsEn,
        keywordsNl: data.keywordsNl,
        category: data.category ?? null,
        priceMin: data.priceMin ?? null,
        priceMax: data.priceMax ?? null,
        searchQuery: data.searchQuery ?? null,
        featuredImage: data.featuredImage ?? null,
        sortOrder: data.sortOrder,
        isPublished: data.isPublished,
        publishedAt: data.publishedAt
          ? new Date(data.publishedAt)
          : data.isPublished
            ? new Date()
            : null,
      },
    });

    return NextResponse.json(
      {
        ...guide,
        priceMin: guide.priceMin ? Number(guide.priceMin) : null,
        priceMax: guide.priceMax ? Number(guide.priceMax) : null,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Error creating gift guide", error);
    return NextResponse.json(
      { error: "Failed to create gift guide" },
      { status: 500 }
    );
  }
}
