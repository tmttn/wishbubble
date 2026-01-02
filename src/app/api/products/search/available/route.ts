import { NextResponse } from "next/server";
import { isSearchAvailable } from "@/lib/product-search";

/**
 * GET /api/products/search/available
 *
 * Check if product search is available (any provider configured)
 */
export async function GET() {
  const available = await isSearchAvailable();
  return NextResponse.json({ available });
}
