import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

// GET /api/gift-guides/[slug] - Get a single gift guide with products
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "12", 10);

    const guide = await prisma.giftGuide.findUnique({
      where: { slug },
    });

    if (!guide || !guide.isPublished) {
      return NextResponse.json(
        { error: "Gift guide not found" },
        { status: 404 }
      );
    }

    // Search for products based on guide settings
    let products: Array<{
      id: string;
      title: string;
      description: string | null;
      price: number | null;
      currency: string;
      imageUrl: string | null;
      url: string;
      affiliateUrl: string | null;
      brand: string | null;
      category: string | null;
    }> = [];

    if (guide.searchQuery) {
      const priceMin = guide.priceMin ? Number(guide.priceMin) : undefined;
      const priceMax = guide.priceMax ? Number(guide.priceMax) : undefined;

      const skip = (page - 1) * pageSize;

      // Query products from feed
      const feedProducts = await prisma.feedProduct.findMany({
        where: {
          AND: [
            {
              OR: [
                { title: { contains: guide.searchQuery, mode: "insensitive" } },
                { searchText: { contains: guide.searchQuery, mode: "insensitive" } },
              ],
            },
            priceMin ? { price: { gte: priceMin } } : {},
            priceMax ? { price: { lte: priceMax } } : {},
            { availability: "IN_STOCK" },
          ],
        },
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          currency: true,
          imageUrl: true,
          url: true,
          affiliateUrl: true,
          brand: true,
          category: true,
        },
        skip,
        take: pageSize,
        orderBy: { price: "asc" },
      });

      products = feedProducts.map((p) => ({
        ...p,
        price: p.price ? Number(p.price) : null,
      }));
    }

    return NextResponse.json({
      guide: {
        id: guide.id,
        slug: guide.slug,
        titleEn: guide.titleEn,
        titleNl: guide.titleNl,
        descriptionEn: guide.descriptionEn,
        descriptionNl: guide.descriptionNl,
        contentEn: guide.contentEn,
        contentNl: guide.contentNl,
        category: guide.category,
        priceMin: guide.priceMin ? Number(guide.priceMin) : null,
        priceMax: guide.priceMax ? Number(guide.priceMax) : null,
        featuredImage: guide.featuredImage,
        keywordsEn: guide.keywordsEn,
        keywordsNl: guide.keywordsNl,
      },
      products,
      page,
      pageSize,
    });
  } catch (error) {
    logger.error("Error fetching gift guide", error);
    return NextResponse.json(
      { error: "Failed to fetch gift guide" },
      { status: 500 }
    );
  }
}
