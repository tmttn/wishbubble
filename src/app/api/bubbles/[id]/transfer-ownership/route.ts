import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { transferOwnershipSchema } from "@/lib/validators/members";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/bubbles/[id]/transfer-ownership - Transfer ownership to another member
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: bubbleId } = await params;

    // Get the bubble
    const bubble = await prisma.bubble.findUnique({
      where: { id: bubbleId },
      select: { ownerId: true, name: true },
    });

    if (!bubble) {
      return NextResponse.json({ error: "Bubble not found" }, { status: 404 });
    }

    // Only current owner can transfer ownership
    if (bubble.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the owner can transfer ownership" },
        { status: 403 }
      );
    }

    // Validate request body
    const body = await request.json();
    const validation = transferOwnershipSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { newOwnerId } = validation.data;

    // Cannot transfer to self
    if (newOwnerId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot transfer ownership to yourself" },
        { status: 400 }
      );
    }

    // Get the new owner's membership
    const newOwnerMembership = await prisma.bubbleMember.findFirst({
      where: {
        bubbleId,
        userId: newOwnerId,
        leftAt: null,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!newOwnerMembership) {
      return NextResponse.json(
        { error: "Selected user is not a member of this group" },
        { status: 400 }
      );
    }

    // Get current owner's membership
    const currentOwnerMembership = await prisma.bubbleMember.findFirst({
      where: {
        bubbleId,
        userId: session.user.id,
        leftAt: null,
      },
    });

    if (!currentOwnerMembership) {
      return NextResponse.json(
        { error: "Your membership not found" },
        { status: 400 }
      );
    }

    // Perform the transfer in a transaction
    await prisma.$transaction([
      // Update bubble owner
      prisma.bubble.update({
        where: { id: bubbleId },
        data: { ownerId: newOwnerId },
      }),
      // Demote old owner to ADMIN
      prisma.bubbleMember.update({
        where: { id: currentOwnerMembership.id },
        data: { role: "ADMIN" },
      }),
      // Promote new owner to OWNER
      prisma.bubbleMember.update({
        where: { id: newOwnerMembership.id },
        data: { role: "OWNER" },
      }),
      // Log activity
      prisma.activity.create({
        data: {
          bubbleId,
          userId: session.user.id,
          type: "OWNERSHIP_TRANSFERRED",
          metadata: {
            oldOwnerId: session.user.id,
            oldOwnerName: session.user.name,
            newOwnerId: newOwnerId,
            newOwnerName: newOwnerMembership.user.name,
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: `Ownership transferred to ${newOwnerMembership.user.name}`,
      newOwner: {
        id: newOwnerMembership.user.id,
        name: newOwnerMembership.user.name,
      },
    });
  } catch (error) {
    console.error("Error transferring ownership:", error);
    return NextResponse.json(
      { error: "Failed to transfer ownership" },
      { status: 500 }
    );
  }
}
