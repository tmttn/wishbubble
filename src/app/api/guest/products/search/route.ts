import { NextRequest, NextResponse } from "next/server";
import {
  searchProducts,
  searchProvider,
  isSearchAvailable,
  toWishlistItem,
} from "@/lib/product-search";
import { logger } from "@/lib/logger";
import { z } from "zod";

const searchParamsSchema = z.object({
  q: z.string().min(1, "Search query is required"),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(50).default(12),
  sort: z
    .enum(["relevance", "price_asc", "price_desc", "rating"])
    .default("relevance"),
  provider: z.string().optional(),
  priceMin: z.coerce.number().optional(),
  priceMax: z.coerce.number().optional(),
});

/**
 * GET /api/guest/products/search
 *
 * Search for products across all enabled providers (for guest users)
 * This endpoint doesn't require authentication
 *
 * Query params:
 * - q: Search query (required)
 * - page: Page number (default: 1)
 * - pageSize: Results per page (default: 12, max: 50)
 * - sort: relevance | price_asc | price_desc | rating
 * - provider: Optional provider ID to search only that provider
 * - priceMin: Optional minimum price filter
 * - priceMax: Optional maximum price filter
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    const validation = searchParamsSchema.safeParse(params);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { q, page, pageSize, sort, provider, priceMin, priceMax } =
      validation.data;

    // Check if any search providers are available
    const available = await isSearchAvailable();
    if (!available) {
      return NextResponse.json(
        { error: "Product search is not configured" },
        { status: 503 }
      );
    }

    const searchOptions = {
      query: q.trim(),
      page,
      pageSize,
      sort,
      priceMin,
      priceMax,
    };

    // Search specific provider or all providers
    const result = provider
      ? await searchProvider(provider, searchOptions)
      : await searchProducts(searchOptions);

    // Transform products to wishlist-friendly format with additional metadata
    const products = result.products.map((product) => ({
      ...toWishlistItem(product),
      id: product.id,
      providerId: product.providerId,
      ean: product.ean,
      brand: product.brand,
      category: product.category,
      rating: product.rating,
      originalPrice: product.originalPrice,
      availability: product.availability,
    }));

    return NextResponse.json({
      products,
      totalResults: result.totalResults,
      page: result.page,
      pageSize: result.pageSize,
      hasMore: result.page * result.pageSize < result.totalResults,
      providers: result.providers,
    });
  } catch (error) {
    logger.error("Guest product search error", error);

    if (error instanceof Error) {
      if (error.message.includes("Rate limit")) {
        return NextResponse.json(
          { error: "Too many requests. Please try again in a moment." },
          { status: 429 }
        );
      }

      if (error.message.includes("credentials")) {
        return NextResponse.json(
          { error: "Product search is not available" },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to search products" },
      { status: 500 }
    );
  }
}
