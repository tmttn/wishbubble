import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { nanoid } from "nanoid";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/bubbles/[id]/share - Get current share status
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const bubble = await prisma.bubble.findUnique({
      where: { id },
      select: {
        id: true,
        shareCode: true,
        shareEnabled: true,
        members: {
          where: {
            userId: session.user.id,
            leftAt: null,
          },
          select: { role: true },
        },
      },
    });

    if (!bubble) {
      return NextResponse.json({ error: "Bubble not found" }, { status: 404 });
    }

    const member = bubble.members[0];
    if (!member) {
      return NextResponse.json(
        { error: "You are not a member of this group" },
        { status: 403 }
      );
    }

    // Only owner/admin can view share settings
    if (member.role !== "OWNER" && member.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only owners and admins can manage sharing" },
        { status: 403 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://wish-bubble.app";
    const shareUrl = bubble.shareCode
      ? `${baseUrl}/share/${bubble.shareCode}`
      : null;

    return NextResponse.json({
      shareEnabled: bubble.shareEnabled,
      shareCode: bubble.shareCode,
      shareUrl,
    });
  } catch (error) {
    logger.error("Error getting share status", error);
    return NextResponse.json(
      { error: "Failed to get share status" },
      { status: 500 }
    );
  }
}

// POST /api/bubbles/[id]/share - Enable sharing and generate share code
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const bubble = await prisma.bubble.findUnique({
      where: { id },
      select: {
        id: true,
        shareCode: true,
        shareEnabled: true,
        archivedAt: true,
        members: {
          where: {
            userId: session.user.id,
            leftAt: null,
          },
          select: { role: true },
        },
      },
    });

    if (!bubble) {
      return NextResponse.json({ error: "Bubble not found" }, { status: 404 });
    }

    if (bubble.archivedAt) {
      return NextResponse.json(
        { error: "Cannot share an archived group" },
        { status: 400 }
      );
    }

    const member = bubble.members[0];
    if (!member) {
      return NextResponse.json(
        { error: "You are not a member of this group" },
        { status: 403 }
      );
    }

    if (member.role !== "OWNER" && member.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only owners and admins can manage sharing" },
        { status: 403 }
      );
    }

    // Generate new share code if not exists
    const shareCode = bubble.shareCode || nanoid(12);

    await prisma.bubble.update({
      where: { id },
      data: {
        shareCode,
        shareEnabled: true,
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        bubbleId: id,
        userId: session.user.id,
        type: "GROUP_UPDATED",
        metadata: {
          action: "sharing_enabled",
          userName: session.user.name,
        },
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://wish-bubble.app";

    return NextResponse.json({
      shareEnabled: true,
      shareCode,
      shareUrl: `${baseUrl}/share/${shareCode}`,
    });
  } catch (error) {
    logger.error("Error enabling sharing", error);
    return NextResponse.json(
      { error: "Failed to enable sharing" },
      { status: 500 }
    );
  }
}

// DELETE /api/bubbles/[id]/share - Disable sharing
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const bubble = await prisma.bubble.findUnique({
      where: { id },
      select: {
        id: true,
        members: {
          where: {
            userId: session.user.id,
            leftAt: null,
          },
          select: { role: true },
        },
      },
    });

    if (!bubble) {
      return NextResponse.json({ error: "Bubble not found" }, { status: 404 });
    }

    const member = bubble.members[0];
    if (!member) {
      return NextResponse.json(
        { error: "You are not a member of this group" },
        { status: 403 }
      );
    }

    if (member.role !== "OWNER" && member.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only owners and admins can manage sharing" },
        { status: 403 }
      );
    }

    await prisma.bubble.update({
      where: { id },
      data: {
        shareEnabled: false,
        // Keep the shareCode so re-enabling gives the same URL
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        bubbleId: id,
        userId: session.user.id,
        type: "GROUP_UPDATED",
        metadata: {
          action: "sharing_disabled",
          userName: session.user.name,
        },
      },
    });

    return NextResponse.json({
      shareEnabled: false,
    });
  } catch (error) {
    logger.error("Error disabling sharing", error);
    return NextResponse.json(
      { error: "Failed to disable sharing" },
      { status: 500 }
    );
  }
}

// PATCH /api/bubbles/[id]/share - Regenerate share code
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const bubble = await prisma.bubble.findUnique({
      where: { id },
      select: {
        id: true,
        shareEnabled: true,
        archivedAt: true,
        members: {
          where: {
            userId: session.user.id,
            leftAt: null,
          },
          select: { role: true },
        },
      },
    });

    if (!bubble) {
      return NextResponse.json({ error: "Bubble not found" }, { status: 404 });
    }

    if (bubble.archivedAt) {
      return NextResponse.json(
        { error: "Cannot update an archived group" },
        { status: 400 }
      );
    }

    const member = bubble.members[0];
    if (!member) {
      return NextResponse.json(
        { error: "You are not a member of this group" },
        { status: 403 }
      );
    }

    if (member.role !== "OWNER" && member.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only owners and admins can manage sharing" },
        { status: 403 }
      );
    }

    const newShareCode = nanoid(12);

    await prisma.bubble.update({
      where: { id },
      data: {
        shareCode: newShareCode,
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        bubbleId: id,
        userId: session.user.id,
        type: "GROUP_UPDATED",
        metadata: {
          action: "share_code_regenerated",
          userName: session.user.name,
        },
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://wish-bubble.app";

    return NextResponse.json({
      shareEnabled: bubble.shareEnabled,
      shareCode: newShareCode,
      shareUrl: `${baseUrl}/share/${newShareCode}`,
    });
  } catch (error) {
    logger.error("Error regenerating share code", error);
    return NextResponse.json(
      { error: "Failed to regenerate share code" },
      { status: 500 }
    );
  }
}
