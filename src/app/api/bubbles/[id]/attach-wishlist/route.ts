import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createBulkNotifications } from "@/lib/notifications";
import { logger } from "@/lib/logger";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/bubbles/[id]/attach-wishlist - Attach user's wishlist to a bubble
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: bubbleId } = await params;

    // Parse body for optional wishlistId
    let wishlistId: string | undefined;
    try {
      const body = await request.json();
      wishlistId = body.wishlistId;
    } catch {
      // No body or invalid JSON - will use default wishlist
    }

    // Check if user is a member of the bubble
    const membership = await prisma.bubbleMember.findFirst({
      where: {
        bubbleId,
        userId: session.user.id,
        leftAt: null,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Not a member of this bubble" },
        { status: 403 }
      );
    }

    // Get specified or default wishlist
    let wishlist;
    if (wishlistId) {
      wishlist = await prisma.wishlist.findUnique({
        where: { id: wishlistId },
      });
      // Verify ownership
      if (!wishlist || wishlist.userId !== session.user.id) {
        return NextResponse.json(
          { error: "Wishlist not found" },
          { status: 404 }
        );
      }
    } else {
      wishlist = await prisma.wishlist.findFirst({
        where: {
          userId: session.user.id,
          isDefault: true,
        },
      });
    }

    if (!wishlist) {
      return NextResponse.json(
        { error: "No wishlist found" },
        { status: 404 }
      );
    }

    // Check if already attached
    const existing = await prisma.bubbleWishlist.findUnique({
      where: {
        bubbleId_wishlistId: {
          bubbleId,
          wishlistId: wishlist.id,
        },
      },
    });

    if (existing) {
      // If it exists but was hidden, make it visible again
      if (!existing.isVisible) {
        await prisma.bubbleWishlist.update({
          where: { id: existing.id },
          data: { isVisible: true },
        });
        return NextResponse.json({ success: true, reattached: true });
      }
      return NextResponse.json(
        { error: "Wishlist already attached" },
        { status: 400 }
      );
    }

    // Get bubble name and other members for notification
    const bubble = await prisma.bubble.findUnique({
      where: { id: bubbleId },
      select: {
        name: true,
        members: {
          where: {
            userId: { not: session.user.id },
            leftAt: null,
          },
          select: { userId: true },
        },
      },
    });

    // Attach the wishlist
    await prisma.bubbleWishlist.create({
      data: {
        bubbleId,
        wishlistId: wishlist.id,
      },
    });

    // Notify other members that a wishlist was shared
    if (bubble && bubble.members.length > 0) {
      const memberUserIds = bubble.members.map((m) => m.userId);
      await createBulkNotifications(memberUserIds, {
        type: "WISHLIST_ADDED",
        title: `${session.user.name || "Someone"} shared their wishlist`,
        body: `Check out what they're wishing for in ${bubble.name}!`,
        bubbleId,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error attaching wishlist", error);
    return NextResponse.json(
      { error: "Failed to attach wishlist" },
      { status: 500 }
    );
  }
}

// DELETE /api/bubbles/[id]/attach-wishlist - Detach user's wishlist from a bubble
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: bubbleId } = await params;
    const { searchParams } = new URL(request.url);
    const wishlistId = searchParams.get("wishlistId");

    // Get specified or default wishlist
    let wishlist;
    if (wishlistId) {
      wishlist = await prisma.wishlist.findUnique({
        where: { id: wishlistId },
      });
      if (!wishlist || wishlist.userId !== session.user.id) {
        return NextResponse.json(
          { error: "Wishlist not found" },
          { status: 404 }
        );
      }
    } else {
      wishlist = await prisma.wishlist.findFirst({
        where: {
          userId: session.user.id,
          isDefault: true,
        },
      });
    }

    if (!wishlist) {
      return NextResponse.json(
        { error: "No wishlist found" },
        { status: 404 }
      );
    }

    // Hide the wishlist from the bubble (soft delete)
    await prisma.bubbleWishlist.updateMany({
      where: {
        bubbleId,
        wishlistId: wishlist.id,
      },
      data: { isVisible: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error detaching wishlist", error);
    return NextResponse.json(
      { error: "Failed to detach wishlist" },
      { status: 500 }
    );
  }
}
