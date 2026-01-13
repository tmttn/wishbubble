import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canUseGiftHistory } from "@/lib/plans";
import { handleApiError } from "@/lib/api-error";

// Types for the response
interface GiftHistoryItem {
  claimId: string;
  status: "CLAIMED" | "PURCHASED";
  claimedAt: Date;
  purchasedAt: Date | null;
  item: {
    id: string;
    title: string;
    imageUrl: string | null;
    uploadedImage: string | null;
    price: number | null;
    priceMax: number | null;
    currency: string;
  };
  recipient: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
}

interface GiftHistoryBubble {
  bubble: {
    id: string;
    name: string;
    eventDate: Date | null;
    postEventProcessed: boolean;
    archivedAt: Date | null;
  };
  items: GiftHistoryItem[];
}

interface GiftHistoryResponse {
  gifts: GiftHistoryBubble[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// GET /api/user/gift-history - Get user's gift history
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user can use gift history feature
    const { allowed } = await canUseGiftHistory(session.user.id);
    if (!allowed) {
      return NextResponse.json(
        { error: "Gift history is only available on the Complete plan" },
        { status: 403 }
      );
    }

    // Parse pagination params
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await prisma.claim.count({
      where: {
        userId: session.user.id,
        status: { in: ["CLAIMED", "PURCHASED"] },
      },
    });

    // Query claims with related data
    const claims = await prisma.claim.findMany({
      where: {
        userId: session.user.id,
        status: { in: ["CLAIMED", "PURCHASED"] },
      },
      include: {
        item: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
            uploadedImage: true,
            price: true,
            priceMax: true,
            currency: true,
            wishlist: {
              select: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
        bubble: {
          select: {
            id: true,
            name: true,
            eventDate: true,
            postEventProcessed: true,
            archivedAt: true,
          },
        },
      },
      orderBy: [
        { bubble: { eventDate: "desc" } },
        { claimedAt: "desc" },
      ],
      skip,
      take: limit,
    });

    // Group claims by bubble
    const bubbleMap = new Map<string, GiftHistoryBubble>();

    for (const claim of claims) {
      const bubbleId = claim.bubble.id;

      if (!bubbleMap.has(bubbleId)) {
        bubbleMap.set(bubbleId, {
          bubble: {
            id: claim.bubble.id,
            name: claim.bubble.name,
            eventDate: claim.bubble.eventDate,
            postEventProcessed: claim.bubble.postEventProcessed,
            archivedAt: claim.bubble.archivedAt,
          },
          items: [],
        });
      }

      const giftItem: GiftHistoryItem = {
        claimId: claim.id,
        status: claim.status as "CLAIMED" | "PURCHASED",
        claimedAt: claim.claimedAt,
        purchasedAt: claim.purchasedAt,
        item: {
          id: claim.item.id,
          title: claim.item.title,
          imageUrl: claim.item.imageUrl,
          uploadedImage: claim.item.uploadedImage,
          price: claim.item.price ? Number(claim.item.price) : null,
          priceMax: claim.item.priceMax ? Number(claim.item.priceMax) : null,
          currency: claim.item.currency,
        },
        recipient: {
          id: claim.item.wishlist.user.id,
          name: claim.item.wishlist.user.name,
          avatarUrl: claim.item.wishlist.user.avatarUrl,
        },
      };

      bubbleMap.get(bubbleId)!.items.push(giftItem);
    }

    // Convert map to array (maintains insertion order which respects our sort)
    const gifts = Array.from(bubbleMap.values());

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      gifts,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    return handleApiError(error, "gift-history");
  }
}
