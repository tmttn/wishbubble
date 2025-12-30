import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const claimSchema = z.object({
  itemId: z.string(),
  bubbleId: z.string(),
  quantity: z.number().min(1).default(1),
});

// POST /api/claims - Claim an item
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = claimSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validatedData.error.issues },
        { status: 400 }
      );
    }

    const { itemId, bubbleId, quantity } = validatedData.data;

    // Verify user is a member of the bubble
    const membership = await prisma.bubbleMember.findUnique({
      where: {
        bubbleId_userId: {
          bubbleId,
          userId: session.user.id,
        },
      },
    });

    if (!membership || membership.leftAt) {
      return NextResponse.json(
        { error: "You are not a member of this bubble" },
        { status: 403 }
      );
    }

    // Get the item and check ownership
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

    // Prevent users from claiming their own items
    if (item.wishlist.userId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot claim your own items" },
        { status: 400 }
      );
    }

    // Check if item is already fully claimed
    const existingClaims = await prisma.claim.findMany({
      where: {
        itemId,
        bubbleId,
        status: { in: ["CLAIMED", "PURCHASED"] },
      },
    });

    const totalClaimed = existingClaims.reduce((sum: number, c: { quantity: number }) => sum + c.quantity, 0);
    if (totalClaimed + quantity > item.quantity) {
      return NextResponse.json(
        { error: "Item is already claimed or not enough quantity available" },
        { status: 400 }
      );
    }

    // Check if user already has an active claim
    const userExistingClaim = existingClaims.find(
      (c: { userId: string }) => c.userId === session.user.id
    );

    if (userExistingClaim) {
      return NextResponse.json(
        { error: "You already have a claim on this item" },
        { status: 400 }
      );
    }

    // Create the claim and activity log
    const [claim] = await prisma.$transaction([
      prisma.claim.create({
        data: {
          itemId,
          bubbleId,
          userId: session.user.id,
          quantity,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
        include: {
          user: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
      }),
      prisma.activity.create({
        data: {
          bubbleId,
          userId: session.user.id,
          type: "ITEM_CLAIMED",
          metadata: {
            itemId,
            itemTitle: item.title,
            userName: session.user.name,
          },
        },
      }),
    ]);

    return NextResponse.json(claim, { status: 201 });
  } catch (error) {
    console.error("Error creating claim:", error);
    return NextResponse.json(
      { error: "Failed to create claim" },
      { status: 500 }
    );
  }
}

// DELETE /api/claims?id=xxx - Unclaim an item
export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const claimId = searchParams.get("id");

    if (!claimId) {
      return NextResponse.json(
        { error: "Claim ID is required" },
        { status: 400 }
      );
    }

    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
    });

    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    if (claim.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only unclaim your own claims" },
        { status: 403 }
      );
    }

    if (claim.status === "PURCHASED") {
      return NextResponse.json(
        { error: "Cannot unclaim a purchased item" },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.claim.update({
        where: { id: claimId },
        data: {
          status: "UNCLAIMED",
          unclaimedAt: new Date(),
        },
      }),
      prisma.activity.create({
        data: {
          bubbleId: claim.bubbleId,
          userId: session.user.id,
          type: "ITEM_UNCLAIMED",
          metadata: {
            itemId: claim.itemId,
            userName: session.user.name,
          },
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error unclaiming:", error);
    return NextResponse.json(
      { error: "Failed to unclaim" },
      { status: 500 }
    );
  }
}

// PATCH /api/claims?id=xxx - Mark as purchased
export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const claimId = searchParams.get("id");

    if (!claimId) {
      return NextResponse.json(
        { error: "Claim ID is required" },
        { status: 400 }
      );
    }

    const claim = await prisma.claim.findUnique({
      where: { id: claimId },
    });

    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    if (claim.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only update your own claims" },
        { status: 403 }
      );
    }

    const [updatedClaim] = await prisma.$transaction([
      prisma.claim.update({
        where: { id: claimId },
        data: {
          status: "PURCHASED",
          purchasedAt: new Date(),
        },
      }),
      prisma.activity.create({
        data: {
          bubbleId: claim.bubbleId,
          userId: session.user.id,
          type: "ITEM_PURCHASED",
          metadata: {
            itemId: claim.itemId,
            userName: session.user.name,
          },
        },
      }),
    ]);

    return NextResponse.json(updatedClaim);
  } catch (error) {
    console.error("Error updating claim:", error);
    return NextResponse.json(
      { error: "Failed to update claim" },
      { status: 500 }
    );
  }
}
