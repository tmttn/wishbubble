import { NextResponse } from "next/server";
import { isSearchAvailable } from "@/lib/product-search";

/**
 * GET /api/guest/products/search/available
 *
 * Check if product search is available (any provider configured)
 * This endpoint doesn't require authentication
 */
export async function GET() {
  const available = await isSearchAvailable();
  return NextResponse.json({ available });
}
