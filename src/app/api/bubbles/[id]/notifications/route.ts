import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/bubbles/[id]/notifications - Get notification settings for user in this bubble
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: bubbleId } = await params;

    const membership = await prisma.bubbleMember.findFirst({
      where: {
        bubbleId,
        userId: session.user.id,
        leftAt: null,
      },
      select: { notifyActivity: true },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Not a member of this bubble" },
        { status: 403 }
      );
    }

    return NextResponse.json({ notifyActivity: membership.notifyActivity });
  } catch (error) {
    logger.error("Error getting bubble notification settings", error);
    return NextResponse.json(
      { error: "Failed to get notification settings" },
      { status: 500 }
    );
  }
}

// PATCH /api/bubbles/[id]/notifications - Update notification settings for user in this bubble
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: bubbleId } = await params;
    const body = await request.json();
    const { notifyActivity } = body;

    if (typeof notifyActivity !== "boolean") {
      return NextResponse.json(
        { error: "notifyActivity must be a boolean" },
        { status: 400 }
      );
    }

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

    await prisma.bubbleMember.update({
      where: { id: membership.id },
      data: { notifyActivity },
    });

    return NextResponse.json({ success: true, notifyActivity });
  } catch (error) {
    logger.error("Error updating bubble notification settings", error);
    return NextResponse.json(
      { error: "Failed to update notification settings" },
      { status: 500 }
    );
  }
}
