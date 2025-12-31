import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendBubbleInvitation } from "@/lib/email";
import { inviteMembersSchema } from "@/lib/validators/bubble";
import { createNotification } from "@/lib/notifications";
import { canAddMember } from "@/lib/plans";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/bubbles/[id]/invite - Send invitations to join a bubble
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: bubbleId } = await params;
    const body = await request.json();
    const validatedData = inviteMembersSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validatedData.error.issues },
        { status: 400 }
      );
    }

    // Check if user is a member with invite permissions
    const bubble = await prisma.bubble.findUnique({
      where: { id: bubbleId },
      include: {
        members: {
          where: {
            userId: session.user.id,
            leftAt: null,
          },
        },
        owner: {
          select: { name: true },
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
        { error: "You don't have permission to invite members" },
        { status: 403 }
      );
    }

    // Check member limit based on owner's plan
    const memberLimitCheck = await canAddMember(bubble.ownerId, bubbleId);
    const { emails } = validatedData.data;

    // Calculate how many new members would be added (excluding already members/invited)
    const pendingInviteCount = await prisma.invitation.count({
      where: {
        bubbleId,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
    });

    const currentTotal = memberLimitCheck.current + pendingInviteCount;
    const availableSlots = memberLimitCheck.limit === -1
      ? Infinity
      : memberLimitCheck.limit - currentTotal;

    if (availableSlots <= 0 && memberLimitCheck.limit !== -1) {
      return NextResponse.json(
        {
          error: "Member limit reached",
          limitReached: true,
          current: memberLimitCheck.current,
          limit: memberLimitCheck.limit,
          upgradeRequired: memberLimitCheck.upgradeRequired,
        },
        { status: 403 }
      );
    }
    const results = [];
    let invitesSent = 0;

    for (const email of emails) {
      // Check if we would exceed the limit with this invite
      if (memberLimitCheck.limit !== -1 && currentTotal + invitesSent >= memberLimitCheck.limit) {
        results.push({ email, status: "limit_reached" });
        continue;
      }

      // Check if already a member
      const existingMember = await prisma.bubbleMember.findFirst({
        where: {
          bubbleId,
          user: { email },
          leftAt: null,
        },
      });

      if (existingMember) {
        results.push({ email, status: "already_member" });
        continue;
      }

      // Check if invitation already pending
      const existingInvite = await prisma.invitation.findFirst({
        where: {
          bubbleId,
          email,
          status: "PENDING",
          expiresAt: { gt: new Date() },
        },
      });

      if (existingInvite) {
        results.push({ email, status: "already_invited" });
        continue;
      }

      // Check if the user already has an account
      const existingUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true, locale: true },
      });

      // Create invitation
      const invitation = await prisma.invitation.create({
        data: {
          bubbleId,
          email,
          invitedBy: session.user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      // Count this as a pending invite for limit tracking
      invitesSent++;

      // If user has an account, send in-app notification
      if (existingUser) {
        await createNotification({
          userId: existingUser.id,
          type: "BUBBLE_INVITATION",
          title: `${session.user.name || "Someone"} invited you to ${bubble.name}`,
          body: "Join their group to share wishlists and coordinate gifts!",
          bubbleId,
          data: { inviteToken: invitation.token },
        });
      }

      // Send email
      try {
        const baseUrl = process.env.NEXTAUTH_URL || "https://wishbubble.app";
        await sendBubbleInvitation({
          to: email,
          inviterName: session.user.name || "Someone",
          bubbleName: bubble.name,
          inviteUrl: `${baseUrl}/invite/${invitation.token}`,
          locale: existingUser?.locale || "en",
        });
        results.push({ email, status: "sent" });
      } catch (emailError) {
        console.error(`Failed to send email to ${email}:`, emailError);
        results.push({ email, status: "email_failed" });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Error sending invitations:", error);
    return NextResponse.json(
      { error: "Failed to send invitations" },
      { status: 500 }
    );
  }
}

// GET /api/bubbles/[id]/invite - Get pending invitations
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

    const invitations = await prisma.invitation.findMany({
      where: {
        bubbleId,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
      include: {
        inviter: {
          select: { name: true },
        },
      },
      orderBy: { sentAt: "desc" },
    });

    return NextResponse.json(invitations);
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500 }
    );
  }
}
