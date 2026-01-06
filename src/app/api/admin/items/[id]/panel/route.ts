import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/items/[id]/panel
 * Get wishlist item data optimized for the detail panel view
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

    const item = await prisma.wishlistItem.findUnique({
      where: { id },
      include: {
        wishlist: {
          select: {
            id: true,
            name: true,
            isDefault: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                avatarUrl: true,
              },
            },
          },
        },
        claims: {
          where: { status: { not: "UNCLAIMED" } },
          select: {
            id: true,
            status: true,
            quantity: true,
            isGroupGift: true,
            contribution: true,
            claimedAt: true,
            purchasedAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                avatarUrl: true,
              },
            },
            bubble: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { claimedAt: "desc" },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Check if item is deleted (soft delete)
    const isDeleted = !!item.deletedAt;

    // Transform for response
    const response = {
      id: item.id,
      title: item.title,
      description: item.description,
      price: item.price?.toString() || null,
      priceMax: item.priceMax?.toString() || null,
      currency: item.currency,
      url: item.url,
      imageUrl: item.imageUrl,
      uploadedImage: item.uploadedImage,
      priority: item.priority,
      quantity: item.quantity,
      category: item.category,
      notes: item.notes,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      deletedAt: item.deletedAt?.toISOString() || null,
      isDeleted,
      wishlist: {
        id: item.wishlist.id,
        name: item.wishlist.name,
        isDefault: item.wishlist.isDefault,
        owner: item.wishlist.user,
      },
      claims: item.claims.map((claim) => ({
        id: claim.id,
        status: claim.status,
        quantity: claim.quantity,
        isGroupGift: claim.isGroupGift,
        contribution: claim.contribution?.toString() || null,
        claimedAt: claim.claimedAt.toISOString(),
        purchasedAt: claim.purchasedAt?.toISOString() || null,
        user: claim.user,
        bubble: claim.bubble,
      })),
      counts: {
        claims: item.claims.length,
        totalQuantityClaimed: item.claims.reduce((sum, c) => sum + c.quantity, 0),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching item panel data:", error);
    return NextResponse.json(
      { error: "Failed to fetch item data" },
      { status: 500 }
    );
  }
}
