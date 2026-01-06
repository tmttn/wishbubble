import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/wishlists/[id]/panel
 * Get wishlist data optimized for the detail panel view
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const adminCheck = await requireAdminApi();
    if (adminCheck.error) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    const { id } = await params;

    const wishlist = await prisma.wishlist.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            avatarUrl: true,
          },
        },
        items: {
          where: { deletedAt: null },
          select: {
            id: true,
            title: true,
            price: true,
            currency: true,
            priority: true,
            imageUrl: true,
            url: true,
            createdAt: true,
            claims: {
              where: { status: { not: "UNCLAIMED" } },
              select: {
                id: true,
                status: true,
                claimedAt: true,
                user: {
                  select: { id: true, name: true },
                },
                bubble: {
                  select: { id: true, name: true },
                },
              },
              take: 1,
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        bubbles: {
          select: {
            bubble: {
              select: {
                id: true,
                name: true,
                occasionType: true,
                archivedAt: true,
              },
            },
          },
          take: 10,
        },
        _count: {
          select: {
            items: true,
            bubbles: true,
          },
        },
      },
    });

    if (!wishlist) {
      return NextResponse.json({ error: "Wishlist not found" }, { status: 404 });
    }

    // Count total claims across all items (excluding unclaimed)
    const claimsCount = await prisma.claim.count({
      where: {
        item: { wishlistId: id },
        status: { not: "UNCLAIMED" },
      },
    });

    // Transform for response
    const response = {
      id: wishlist.id,
      name: wishlist.name,
      description: wishlist.description,
      isDefault: wishlist.isDefault,
      createdAt: wishlist.createdAt.toISOString(),
      owner: wishlist.user,
      items: wishlist.items.map((item) => ({
        id: item.id,
        title: item.title,
        price: item.price?.toString() || null,
        currency: item.currency,
        priority: item.priority,
        imageUrl: item.imageUrl,
        url: item.url,
        createdAt: item.createdAt.toISOString(),
        claim: item.claims[0]
          ? {
              id: item.claims[0].id,
              status: item.claims[0].status,
              claimedAt: item.claims[0].claimedAt.toISOString(),
              userName: item.claims[0].user?.name || null,
              userId: item.claims[0].user?.id || null,
              bubbleName: item.claims[0].bubble?.name || null,
              bubbleId: item.claims[0].bubble?.id || null,
            }
          : null,
      })),
      sharedInBubbles: wishlist.bubbles.map((bw) => ({
        id: bw.bubble.id,
        name: bw.bubble.name,
        occasionType: bw.bubble.occasionType,
        isArchived: !!bw.bubble.archivedAt,
      })),
      counts: {
        items: wishlist._count.items,
        bubbles: wishlist._count.bubbles,
        claims: claimsCount,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching wishlist panel data:", error);
    return NextResponse.json(
      { error: "Failed to fetch wishlist data" },
      { status: 500 }
    );
  }
}
