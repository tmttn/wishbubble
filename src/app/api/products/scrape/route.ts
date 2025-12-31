import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { scrapeUrl, detectRetailer } from "@/lib/url-scraper";
import {
  isBolcomUrl,
  extractEanFromUrl,
  getProductByEan,
  transformToWishlistItem,
  isBolcomConfigured,
} from "@/lib/bolcom";

/**
 * POST /api/products/scrape
 *
 * Scrape product metadata from a URL
 *
 * Body:
 * - url: The product URL to scrape
 *
 * Returns scraped product data that can be used to pre-fill wishlist item form
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Special handling for Bol.com URLs - use API for better data
    if (isBolcomUrl(url) && isBolcomConfigured()) {
      const ean = extractEanFromUrl(url);

      if (ean) {
        const product = await getProductByEan(ean);

        if (product) {
          const data = transformToWishlistItem(product);
          return NextResponse.json({
            success: true,
            data: {
              ...data,
              source: "bolcom",
              retailer: "bolcom",
            },
          });
        }
      }
    }

    // Fall back to generic scraping
    const data = await scrapeUrl(url);

    if (!data || !data.title) {
      return NextResponse.json({
        success: false,
        error: "Could not extract product information from this URL",
      });
    }

    const retailer = detectRetailer(url);

    return NextResponse.json({
      success: true,
      data: {
        ...data,
        url, // Keep the original URL
        source: "scrape",
        retailer,
      },
    });
  } catch (error) {
    console.error("URL scrape error:", error);

    return NextResponse.json(
      { error: "Failed to scrape URL" },
      { status: 500 }
    );
  }
}
