import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendBubbleInvitation } from "@/lib/email";
import { inviteMembersSchema } from "@/lib/validators/bubble";
import { createNotification } from "@/lib/notifications";
import { canAddMember } from "@/lib/plans";
import { logger } from "@/lib/logger";

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

    // Batch fetch all data upfront to avoid N+1 queries
    const [existingMembers, existingInvites, existingUsers] = await Promise.all([
      // Get all members of this bubble who have one of the provided emails
      prisma.bubbleMember.findMany({
        where: {
          bubbleId,
          user: { email: { in: emails } },
          leftAt: null,
        },
        include: { user: { select: { email: true } } },
      }),
      // Get all pending invitations for these emails
      prisma.invitation.findMany({
        where: {
          bubbleId,
          email: { in: emails },
          status: "PENDING",
          expiresAt: { gt: new Date() },
        },
        select: { email: true },
      }),
      // Get all existing users with these emails
      prisma.user.findMany({
        where: { email: { in: emails } },
        select: { id: true, email: true, locale: true },
      }),
    ]);

    // Create lookup sets/maps for O(1) access
    const memberEmails = new Set(existingMembers.map((m) => m.user.email.toLowerCase()));
    const invitedEmails = new Set(existingInvites.map((i) => i.email.toLowerCase()));
    const usersByEmail = new Map(existingUsers.map((u) => [u.email.toLowerCase(), u]));

    for (const email of emails) {
      const emailLower = email.toLowerCase();

      // Check if we would exceed the limit with this invite
      if (memberLimitCheck.limit !== -1 && currentTotal + invitesSent >= memberLimitCheck.limit) {
        results.push({ email, status: "limit_reached" });
        continue;
      }

      // Check if already a member
      if (memberEmails.has(emailLower)) {
        results.push({ email, status: "already_member" });
        continue;
      }

      // Check if invitation already pending
      if (invitedEmails.has(emailLower)) {
        results.push({ email, status: "already_invited" });
        continue;
      }

      // Get existing user if they have an account
      const existingUser = usersByEmail.get(emailLower);

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
        logger.error("Failed to send invitation email", emailError, {
          email,
          bubbleId,
        });
        results.push({ email, status: "email_failed" });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    logger.error("Error sending invitations", error);
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
    logger.error("Error fetching invitations", error);
    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500 }
    );
  }
}
