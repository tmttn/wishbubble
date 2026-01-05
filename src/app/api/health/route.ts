import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

// Health check endpoint that warms up the database connection
// Can be called by Vercel's deployment hooks or monitoring
export async function GET() {
  try {
    // Simple query to warm up the connection pool
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Health check failed:", error);

    return NextResponse.json(
      {
        status: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
