import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/bubbles/[id]/gift-summary - Get gift summary for post-event display
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: bubbleId } = await params;

    // Check membership
    const membership = await prisma.bubbleMember.findFirst({
      where: {
        bubbleId,
        userId: session.user.id,
        leftAt: null,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "You are not a member of this bubble" },
        { status: 403 }
      );
    }

    // Get bubble to check if event has passed and revealGivers setting
    const bubble = await prisma.bubble.findUnique({
      where: { id: bubbleId },
      select: { eventDate: true, revealGivers: true },
    });

    if (!bubble?.eventDate) {
      return NextResponse.json(
        { error: "This bubble has no event date" },
        { status: 400 }
      );
    }

    // Only show gift summary after event date
    if (new Date(bubble.eventDate) > new Date()) {
      return NextResponse.json(
        { error: "Event has not passed yet" },
        { status: 400 }
      );
    }

    // Get all claimed/purchased gifts for items owned by bubble members
    const claims = await prisma.claim.findMany({
      where: {
        bubbleId,
        status: { in: ["CLAIMED", "PURCHASED"] },
      },
      include: {
        item: {
          select: {
            id: true,
            title: true,
            price: true,
            currency: true,
            url: true,
            wishlist: {
              select: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Transform to gift summary format
    // If revealGivers is false, only show claimedBy info for the current user's claims
    const gifts = claims.map((claim) => ({
      id: claim.item.id,
      title: claim.item.title,
      price: claim.item.price,
      currency: claim.item.currency,
      url: claim.item.url,
      status: claim.status,
      claimedBy: bubble.revealGivers || claim.user.id === session.user.id
        ? {
            id: claim.user.id,
            name: claim.user.name,
            avatarUrl: claim.user.image || claim.user.avatarUrl,
          }
        : null,
      recipient: {
        id: claim.item.wishlist.user.id,
        name: claim.item.wishlist.user.name,
        avatarUrl: claim.item.wishlist.user.image || claim.item.wishlist.user.avatarUrl,
      },
    }));

    return NextResponse.json({ gifts, revealGivers: bubble.revealGivers });
  } catch (error) {
    console.error("Error fetching gift summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch gift summary" },
      { status: 500 }
    );
  }
}
