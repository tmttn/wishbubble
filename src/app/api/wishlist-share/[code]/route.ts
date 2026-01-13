import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import {
  checkRateLimit,
  getClientIp,
  rateLimiters,
} from "@/lib/rate-limit";

interface RouteParams {
  params: Promise<{ code: string }>;
}

// GET /api/wishlist-share/[code] - Get public wishlist info (no auth required)
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { code } = await params;
    const clientIp = getClientIp(request);

    // Rate limiting
    const rateLimitResult = await checkRateLimit(clientIp, rateLimiters.publicShare, {
      userAgent: request.headers.get("user-agent") || undefined,
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)
            ),
          },
        }
      );
    }

    const wishlist = await prisma.wishlist.findUnique({
      where: { shareCode: code },
      select: {
        id: true,
        name: true,
        description: true,
        shareEnabled: true,
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            image: true,
          },
        },
        items: {
          where: { deletedAt: null },
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            title: true,
            description: true,
            price: true,
            priceMax: true,
            currency: true,
            url: true,
            imageUrl: true,
            uploadedImage: true,
            priority: true,
            quantity: true,
            category: true,
            // NOTE: We do NOT include claims - preserve the surprise!
          },
        },
      },
    });

    if (!wishlist) {
      return NextResponse.json(
        { error: "Invalid share link" },
        { status: 404 }
      );
    }

    if (!wishlist.shareEnabled) {
      return NextResponse.json(
        { error: "Sharing is disabled for this wishlist" },
        { status: 403 }
      );
    }

    // Transform items for response (convert Decimal to number)
    const items = wishlist.items.map((item) => ({
      ...item,
      price: item.price ? Number(item.price) : null,
      priceMax: item.priceMax ? Number(item.priceMax) : null,
    }));

    return NextResponse.json({
      wishlist: {
        id: wishlist.id,
        name: wishlist.name,
        description: wishlist.description,
      },
      owner: {
        name: wishlist.user.name,
        avatarUrl: wishlist.user.avatarUrl || wishlist.user.image,
      },
      items,
      totalItems: items.length,
    });
  } catch (error) {
    logger.error("Error fetching public wishlist", error);
    return NextResponse.json(
      { error: "Failed to fetch wishlist" },
      { status: 500 }
    );
  }
}
