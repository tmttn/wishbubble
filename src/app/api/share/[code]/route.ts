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

// GET /api/share/[code] - Get public bubble/wishlist info (no auth required)
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

    const bubble = await prisma.bubble.findUnique({
      where: { shareCode: code },
      select: {
        id: true,
        name: true,
        description: true,
        occasionType: true,
        eventDate: true,
        archivedAt: true,
        shareEnabled: true,
        themeColor: true,
        coverImageUrl: true,
        owner: {
          select: { name: true },
        },
        _count: { select: { members: { where: { leftAt: null } } } },
        wishlists: {
          where: { isVisible: true },
          select: {
            wishlist: {
              select: {
                id: true,
                name: true,
                description: true,
                user: {
                  select: { name: true },
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
            },
          },
        },
      },
    });

    if (!bubble) {
      return NextResponse.json(
        { error: "Invalid share link" },
        { status: 404 }
      );
    }

    if (!bubble.shareEnabled) {
      return NextResponse.json(
        { error: "Sharing is disabled for this wishlist" },
        { status: 403 }
      );
    }

    if (bubble.archivedAt) {
      return NextResponse.json(
        { error: "This group has been archived" },
        { status: 400 }
      );
    }

    // Transform wishlists for response
    const wishlists = bubble.wishlists.map((bw) => ({
      id: bw.wishlist.id,
      name: bw.wishlist.name,
      description: bw.wishlist.description,
      ownerName: bw.wishlist.user.name,
      items: bw.wishlist.items.map((item) => ({
        ...item,
        price: item.price ? Number(item.price) : null,
        priceMax: item.priceMax ? Number(item.priceMax) : null,
      })),
    }));

    // Calculate total items count
    const totalItems = wishlists.reduce((acc, w) => acc + w.items.length, 0);

    return NextResponse.json({
      bubble: {
        id: bubble.id,
        name: bubble.name,
        description: bubble.description,
        occasionType: bubble.occasionType,
        eventDate: bubble.eventDate,
        memberCount: bubble._count.members,
        themeColor: bubble.themeColor,
        coverImageUrl: bubble.coverImageUrl,
      },
      ownerName: bubble.owner.name,
      wishlists,
      totalItems,
    });
  } catch (error) {
    logger.error("Error fetching public share", error);
    return NextResponse.json(
      { error: "Failed to fetch wishlist" },
      { status: 500 }
    );
  }
}
