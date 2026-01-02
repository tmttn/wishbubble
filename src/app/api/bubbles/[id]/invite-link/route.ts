import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { nanoid } from "nanoid";
import { logger } from "@/lib/logger";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/bubbles/[id]/invite-link - Get or create invite link
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: bubbleId } = await params;

    // Check if user is admin/owner
    const bubble = await prisma.bubble.findUnique({
      where: { id: bubbleId },
      include: {
        members: {
          where: {
            userId: session.user.id,
            leftAt: null,
          },
        },
      },
    });

    if (!bubble) {
      return NextResponse.json({ error: "Bubble not found" }, { status: 404 });
    }

    const membership = bubble.members[0];
    const isOwner = bubble.ownerId === session.user.id;
    const isAdmin = membership?.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to access invite links" },
        { status: 403 }
      );
    }

    // Generate invite code if it doesn't exist
    let inviteCode = bubble.inviteCode;
    if (!inviteCode) {
      inviteCode = nanoid(12);
      await prisma.bubble.update({
        where: { id: bubbleId },
        data: { inviteCode },
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://wish-bubble.app";
    const inviteLink = `${baseUrl}/join/${inviteCode}`;

    return NextResponse.json({ inviteCode, inviteLink });
  } catch (error) {
    logger.error("Error getting invite link", error);
    return NextResponse.json(
      { error: "Failed to get invite link" },
      { status: 500 }
    );
  }
}

// DELETE /api/bubbles/[id]/invite-link - Reset invite link
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: bubbleId } = await params;

    // Check if user is admin/owner
    const bubble = await prisma.bubble.findUnique({
      where: { id: bubbleId },
      include: {
        members: {
          where: {
            userId: session.user.id,
            leftAt: null,
          },
        },
      },
    });

    if (!bubble) {
      return NextResponse.json({ error: "Bubble not found" }, { status: 404 });
    }

    const membership = bubble.members[0];
    const isOwner = bubble.ownerId === session.user.id;
    const isAdmin = membership?.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "You don't have permission to reset invite links" },
        { status: 403 }
      );
    }

    // Generate new invite code
    const inviteCode = nanoid(12);
    await prisma.bubble.update({
      where: { id: bubbleId },
      data: { inviteCode },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://wish-bubble.app";
    const inviteLink = `${baseUrl}/join/${inviteCode}`;

    return NextResponse.json({ inviteCode, inviteLink });
  } catch (error) {
    logger.error("Error resetting invite link", error);
    return NextResponse.json(
      { error: "Failed to reset invite link" },
      { status: 500 }
    );
  }
}
