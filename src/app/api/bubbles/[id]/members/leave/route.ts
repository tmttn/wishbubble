import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/bubbles/[id]/members/leave - Leave a bubble voluntarily
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

    // Get user's membership
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

    // Owner cannot leave - must transfer ownership first
    if (bubble.ownerId === session.user.id) {
      return NextResponse.json(
        { error: "Owner cannot leave. Transfer ownership first." },
        { status: 400 }
      );
    }

    // Soft-delete membership and log activity
    await prisma.$transaction([
      prisma.bubbleMember.update({
        where: { id: membership.id },
        data: { leftAt: new Date() },
      }),
      prisma.activity.create({
        data: {
          bubbleId,
          userId: session.user.id,
          type: "MEMBER_LEFT",
          metadata: {
            userName: session.user.name,
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: `You have left ${bubble.name}`,
    });
  } catch (error) {
    console.error("Error leaving bubble:", error);
    return NextResponse.json(
      { error: "Failed to leave bubble" },
      { status: 500 }
    );
  }
}
