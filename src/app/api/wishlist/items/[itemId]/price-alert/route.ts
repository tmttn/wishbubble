import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canUsePriceAlerts } from "@/lib/plans";
import { logger } from "@/lib/logger";

interface RouteParams {
  params: Promise<{ itemId: string }>;
}

// GET /api/wishlist/items/[itemId]/price-alert - Get price alert status for an item
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { itemId } = await params;

    // Verify ownership
    const item = await prisma.wishlistItem.findUnique({
      where: { id: itemId },
      include: {
        wishlist: {
          select: { userId: true },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (item.wishlist.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({
      enabled: item.priceAlertEnabled,
      lastCheck: item.lastPriceCheck,
      hasUrl: !!item.url,
      hasPrice: item.price !== null,
    });
  } catch (error) {
    logger.error("Error getting price alert status", error);
    return NextResponse.json(
      { error: "Failed to get price alert status" },
      { status: 500 }
    );
  }
}

// POST /api/wishlist/items/[itemId]/price-alert - Enable price alert for an item
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { itemId } = await params;

    // Check tier permission
    const limitCheck = await canUsePriceAlerts(session.user.id);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: "Price alerts require a Complete subscription",
          upgradeRequired: limitCheck.upgradeRequired,
        },
        { status: 403 }
      );
    }

    // Verify ownership and get item
    const item = await prisma.wishlistItem.findUnique({
      where: { id: itemId },
      include: {
        wishlist: {
          select: { userId: true },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (item.wishlist.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Validate item has a URL and price
    if (!item.url) {
      return NextResponse.json(
        { error: "Price alerts require an item URL" },
        { status: 400 }
      );
    }

    if (item.price === null) {
      return NextResponse.json(
        { error: "Price alerts require an item price" },
        { status: 400 }
      );
    }

    // Enable price alert
    const updatedItem = await prisma.wishlistItem.update({
      where: { id: itemId },
      data: { priceAlertEnabled: true },
    });

    logger.info("Price alert enabled", {
      itemId,
      userId: session.user.id,
      title: item.title,
    });

    return NextResponse.json({
      enabled: updatedItem.priceAlertEnabled,
      message: "Price alert enabled",
    });
  } catch (error) {
    logger.error("Error enabling price alert", error);
    return NextResponse.json(
      { error: "Failed to enable price alert" },
      { status: 500 }
    );
  }
}

// DELETE /api/wishlist/items/[itemId]/price-alert - Disable price alert for an item
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { itemId } = await params;

    // Verify ownership
    const item = await prisma.wishlistItem.findUnique({
      where: { id: itemId },
      include: {
        wishlist: {
          select: { userId: true },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (item.wishlist.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Disable price alert
    const updatedItem = await prisma.wishlistItem.update({
      where: { id: itemId },
      data: { priceAlertEnabled: false },
    });

    logger.info("Price alert disabled", {
      itemId,
      userId: session.user.id,
      title: item.title,
    });

    return NextResponse.json({
      enabled: updatedItem.priceAlertEnabled,
      message: "Price alert disabled",
    });
  } catch (error) {
    logger.error("Error disabling price alert", error);
    return NextResponse.json(
      { error: "Failed to disable price alert" },
      { status: 500 }
    );
  }
}
