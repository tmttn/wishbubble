import { NextResponse } from "next/server";
import { isBolcomConfigured } from "@/lib/bolcom";

/**
 * GET /api/products/search/available
 *
 * Check if product search is available (Bol.com configured)
 */
export async function GET() {
  return NextResponse.json({
    available: isBolcomConfigured(),
  });
}
