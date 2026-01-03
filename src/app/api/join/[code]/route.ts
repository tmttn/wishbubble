import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createLocalizedBulkNotifications } from "@/lib/notifications";
import { sendMemberJoinedNotification } from "@/lib/email";
import { canAddMember } from "@/lib/plans";
import { logger } from "@/lib/logger";

interface RouteParams {
  params: Promise<{ code: string }>;
}

// GET /api/join/[code] - Get bubble info for invite link
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { code } = await params;

    const bubble = await prisma.bubble.findUnique({
      where: { inviteCode: code },
      select: {
        id: true,
        name: true,
        description: true,
        occasionType: true,
        eventDate: true,
        archivedAt: true,
        owner: {
          select: { name: true },
        },
        _count: { select: { members: { where: { leftAt: null } } } },
      },
    });

    if (!bubble) {
      return NextResponse.json(
        { error: "Invalid invite link" },
        { status: 404 }
      );
    }

    if (bubble.archivedAt) {
      return NextResponse.json(
        { error: "This group has been archived" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      bubble: {
        id: bubble.id,
        name: bubble.name,
        description: bubble.description,
        occasionType: bubble.occasionType,
        eventDate: bubble.eventDate,
        memberCount: bubble._count.members,
      },
      ownerName: bubble.owner.name,
    });
  } catch (error) {
    logger.error("Error fetching bubble for invite link", error);
    return NextResponse.json(
      { error: "Failed to fetch group info" },
      { status: 500 }
    );
  }
}

// POST /api/join/[code] - Join bubble via invite link
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code } = await params;

    const bubble = await prisma.bubble.findUnique({
      where: { inviteCode: code },
      include: {
        owner: {
          select: { name: true },
        },
      },
    });

    if (!bubble) {
      return NextResponse.json(
        { error: "Invalid invite link" },
        { status: 404 }
      );
    }

    if (bubble.archivedAt) {
      return NextResponse.json(
        { error: "This group has been archived" },
        { status: 400 }
      );
    }

    // Check if already a member
    const existingMember = await prisma.bubbleMember.findFirst({
      where: {
        bubbleId: bubble.id,
        userId: session.user.id,
        leftAt: null,
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "You are already a member of this group", bubbleId: bubble.id },
        { status: 400 }
      );
    }

    // Check member limit
    const memberLimitCheck = await canAddMember(bubble.ownerId, bubble.id);
    if (!memberLimitCheck.allowed && memberLimitCheck.limit !== -1) {
      return NextResponse.json(
        {
          error: "This group has reached its member limit",
          limitReached: true,
        },
        { status: 403 }
      );
    }

    // Get existing members to notify
    const existingMembers = await prisma.bubbleMember.findMany({
      where: {
        bubbleId: bubble.id,
        leftAt: null,
        userId: { not: session.user.id },
      },
      select: {
        userId: true,
        user: {
          select: {
            email: true,
            locale: true,
            notifyEmail: true,
            emailOnMemberJoined: true,
          },
        },
      },
    });

    // Add user to bubble and cancel any pending invitations for this email
    await prisma.$transaction([
      prisma.bubbleMember.create({
        data: {
          bubbleId: bubble.id,
          userId: session.user.id,
          role: "MEMBER",
        },
      }),
      prisma.activity.create({
        data: {
          bubbleId: bubble.id,
          userId: session.user.id,
          type: "MEMBER_JOINED",
          metadata: {
            userName: session.user.name,
            joinedVia: "invite_link",
          },
        },
      }),
      // Cancel any pending invitations for this user's email
      prisma.invitation.updateMany({
        where: {
          bubbleId: bubble.id,
          email: session.user.email!,
          status: "PENDING",
        },
        data: {
          status: "ACCEPTED",
          acceptedAt: new Date(),
        },
      }),
    ]);

    // Notify existing members
    const memberUserIds = existingMembers.map((m) => m.userId);
    if (memberUserIds.length > 0) {
      await createLocalizedBulkNotifications(memberUserIds, {
        type: "MEMBER_JOINED",
        messageType: "memberJoined",
        messageParams: {
          name: session.user.name || "Someone",
          bubbleName: bubble.name,
        },
        bubbleId: bubble.id,
      });

      // Send email notifications
      const bubbleUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://wish-bubble.app"}/bubbles/${bubble.slug}`;
      const memberName = session.user.name || "Someone";

      const emailPromises = existingMembers
        .filter((m) => m.user.notifyEmail && m.user.emailOnMemberJoined)
        .map((m) =>
          sendMemberJoinedNotification({
            to: m.user.email,
            memberName,
            bubbleName: bubble.name,
            bubbleUrl,
            locale: m.user.locale,
          })
        );

      Promise.all(emailPromises).catch((error) => {
        logger.error("Error sending member joined emails", error);
      });
    }

    return NextResponse.json({
      success: true,
      bubbleId: bubble.id,
    });
  } catch (error) {
    logger.error("Error joining bubble via invite link", error);
    return NextResponse.json(
      { error: "Failed to join group" },
      { status: 500 }
    );
  }
}
