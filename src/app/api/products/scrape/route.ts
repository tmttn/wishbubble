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

    // Normalize URL - add https:// if missing
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    // Validate URL format
    try {
      new URL(normalizedUrl);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Special handling for Bol.com URLs - use API for better data
    if (isBolcomUrl(normalizedUrl) && isBolcomConfigured()) {
      const ean = extractEanFromUrl(normalizedUrl);

      if (ean) {
        // Detect country code from URL (e.g., bol.com/be/ vs bol.com/nl/)
        const isBelgian = normalizedUrl.includes("bol.com/be/");
        const countryCode = isBelgian ? "BE" : "NL";
        const product = await getProductByEan(ean, countryCode);

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
    const data = await scrapeUrl(normalizedUrl);

    if (!data || !data.title) {
      // Provide helpful error message based on retailer
      const retailer = detectRetailer(normalizedUrl);
      let errorMessage = "Could not extract product information from this URL";

      if (retailer === "amazon") {
        errorMessage = "Amazon blocks automatic scraping. Please copy the product details manually.";
      } else if (retailer === "coolblue") {
        errorMessage = "Coolblue blocks automatic scraping. Please copy the product details manually.";
      } else if (retailer === "bolcom") {
        errorMessage = "Bol.com product not found. Please verify the URL or copy the product details manually.";
      }

      return NextResponse.json({
        success: false,
        error: errorMessage,
      });
    }

    const retailer = detectRetailer(normalizedUrl);

    return NextResponse.json({
      success: true,
      data: {
        ...data,
        url: normalizedUrl, // Keep the normalized URL
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
