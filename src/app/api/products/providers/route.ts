import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getProviders } from "@/lib/product-search";
import { logger } from "@/lib/logger";

/**
 * GET /api/products/providers
 *
 * List all available product search providers with their status
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const providers = await getProviders();

    // Filter out scraper from public list (it's a fallback, not a search provider)
    const searchProviders = providers.filter((p) => p.type !== "scraper");

    return NextResponse.json({ providers: searchProviders });
  } catch (error) {
    logger.error("Error fetching providers", error);
    return NextResponse.json(
      { error: "Failed to fetch providers" },
      { status: 500 }
    );
  }
}
