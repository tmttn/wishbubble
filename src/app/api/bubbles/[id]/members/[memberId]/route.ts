import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { changeRoleSchema } from "@/lib/validators/members";
import { logger } from "@/lib/logger";

interface RouteParams {
  params: Promise<{ id: string; memberId: string }>;
}

// PATCH /api/bubbles/[id]/members/[memberId] - Change member role
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: bubbleId, memberId } = await params;

    // Get the bubble to check ownership
    const bubble = await prisma.bubble.findUnique({
      where: { id: bubbleId },
      select: { ownerId: true, name: true },
    });

    if (!bubble) {
      return NextResponse.json({ error: "Bubble not found" }, { status: 404 });
    }

    // Only owner can change roles
    if (bubble.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the owner can change member roles" },
        { status: 403 }
      );
    }

    // Get the target member
    const targetMember = await prisma.bubbleMember.findFirst({
      where: {
        id: memberId,
        bubbleId,
        leftAt: null,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!targetMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Cannot change own role
    if (targetMember.userId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot change your own role" },
        { status: 400 }
      );
    }

    // Validate request body
    const body = await request.json();
    const validation = changeRoleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid role", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { role: newRole } = validation.data;
    const oldRole = targetMember.role;

    // Update role and log activity in a transaction
    const [updatedMember] = await prisma.$transaction([
      prisma.bubbleMember.update({
        where: { id: memberId },
        data: { role: newRole },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      prisma.activity.create({
        data: {
          bubbleId,
          userId: session.user.id,
          type: "MEMBER_ROLE_CHANGED",
          metadata: {
            targetUserId: targetMember.userId,
            targetUserName: targetMember.user.name,
            oldRole,
            newRole,
            changedByName: session.user.name,
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      member: updatedMember,
      message: `${targetMember.user.name} is now ${newRole.toLowerCase()}`,
    });
  } catch (error) {
    logger.error("Error changing member role", error);
    return NextResponse.json(
      { error: "Failed to change member role" },
      { status: 500 }
    );
  }
}

// DELETE /api/bubbles/[id]/members/[memberId] - Remove member from bubble
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: bubbleId, memberId } = await params;

    // Get the bubble
    const bubble = await prisma.bubble.findUnique({
      where: { id: bubbleId },
      select: { ownerId: true, name: true },
    });

    if (!bubble) {
      return NextResponse.json({ error: "Bubble not found" }, { status: 404 });
    }

    // Get current user's membership
    const currentUserMembership = await prisma.bubbleMember.findFirst({
      where: {
        bubbleId,
        userId: session.user.id,
        leftAt: null,
      },
    });

    if (!currentUserMembership) {
      return NextResponse.json(
        { error: "Not a member of this bubble" },
        { status: 403 }
      );
    }

    // Get the target member
    const targetMember = await prisma.bubbleMember.findFirst({
      where: {
        id: memberId,
        bubbleId,
        leftAt: null,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!targetMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Cannot remove self - use leave endpoint instead
    if (targetMember.userId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot remove yourself. Use the leave endpoint instead." },
        { status: 400 }
      );
    }

    const isOwner = bubble.ownerId === session.user.id;
    const isAdmin = currentUserMembership.role === "ADMIN" || currentUserMembership.role === "OWNER";

    // Check permissions:
    // - Owner can remove anyone except themselves
    // - Admin can only remove regular members (not other admins or owner)
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Not authorized to remove members" },
        { status: 403 }
      );
    }

    if (!isOwner && targetMember.role !== "MEMBER") {
      return NextResponse.json(
        { error: "Admins can only remove regular members" },
        { status: 403 }
      );
    }

    // Cannot remove the owner
    if (targetMember.userId === bubble.ownerId) {
      return NextResponse.json(
        { error: "Cannot remove the owner" },
        { status: 400 }
      );
    }

    // Soft-delete the member and log activity
    await prisma.$transaction([
      prisma.bubbleMember.update({
        where: { id: memberId },
        data: { leftAt: new Date() },
      }),
      prisma.activity.create({
        data: {
          bubbleId,
          userId: session.user.id,
          type: "MEMBER_REMOVED",
          metadata: {
            removedUserId: targetMember.userId,
            removedUserName: targetMember.user.name,
            removedByName: session.user.name,
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: `${targetMember.user.name} removed from group`,
    });
  } catch (error) {
    logger.error("Error removing member", error);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}
