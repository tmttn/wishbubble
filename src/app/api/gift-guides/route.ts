import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

// GET /api/gift-guides - List all published gift guides (public)
export async function GET() {
  try {
    const guides = await prisma.giftGuide.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        slug: true,
        titleEn: true,
        titleNl: true,
        descriptionEn: true,
        descriptionNl: true,
        category: true,
        priceMin: true,
        priceMax: true,
        featuredImage: true,
        sortOrder: true,
      },
      orderBy: [{ sortOrder: "asc" }, { publishedAt: "desc" }],
    });

    // Transform for response
    const transformedGuides = guides.map((guide) => ({
      id: guide.id,
      slug: guide.slug,
      titleEn: guide.titleEn,
      titleNl: guide.titleNl,
      descriptionEn: guide.descriptionEn,
      descriptionNl: guide.descriptionNl,
      category: guide.category,
      priceMin: guide.priceMin ? Number(guide.priceMin) : null,
      priceMax: guide.priceMax ? Number(guide.priceMax) : null,
      featuredImage: guide.featuredImage,
    }));

    return NextResponse.json({ guides: transformedGuides });
  } catch (error) {
    logger.error("Error fetching gift guides", error);
    return NextResponse.json(
      { error: "Failed to fetch gift guides" },
      { status: 500 }
    );
  }
}
