import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  searchProducts,
  isBolcomConfigured,
  transformToWishlistItem,
} from "@/lib/bolcom";
import { logger } from "@/lib/logger";

/**
 * GET /api/products/search
 *
 * Search for products on Bol.com
 *
 * Query params:
 * - q: Search query (required)
 * - page: Page number (default: 1)
 * - pageSize: Results per page (default: 12, max: 50)
 * - sort: RELEVANCE | POPULARITY | PRICE_ASC | PRICE_DESC | RATING
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isBolcomConfigured()) {
      return NextResponse.json(
        { error: "Product search is not configured" },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "12", 10);
    const sort = searchParams.get("sort") as
      | "RELEVANCE"
      | "POPULARITY"
      | "PRICE_ASC"
      | "PRICE_DESC"
      | "RATING"
      | null;

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }

    const result = await searchProducts(query.trim(), {
      page,
      pageSize: Math.min(pageSize, 50),
      sort: sort || "RELEVANCE",
    });

    // Transform products to wishlist-friendly format
    const products = result.products.map((product) => ({
      ...transformToWishlistItem(product),
      ean: product.ean,
      bolProductId: product.bolProductId,
      rating: product.rating,
      originalPrice: product.offer?.strikethroughPrice,
    }));

    return NextResponse.json({
      products,
      totalResults: result.totalResultSize,
      page: result.page,
      pageSize: result.pageSize,
      hasMore: result.page * result.pageSize < result.totalResultSize,
    });
  } catch (error) {
    logger.error("Product search error", error);

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
