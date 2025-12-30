import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendBubbleInvitation } from "@/lib/email";
import { inviteMembersSchema } from "@/lib/validators/bubble";

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

    const { emails } = validatedData.data;
    const results = [];

    for (const email of emails) {
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

      // Create invitation
      const invitation = await prisma.invitation.create({
        data: {
          bubbleId,
          email,
          invitedBy: session.user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      // Send email
      try {
        const baseUrl = process.env.NEXTAUTH_URL || "https://wishbubble.app";
        await sendBubbleInvitation({
          to: email,
          inviterName: session.user.name || "Someone",
          bubbleName: bubble.name,
          inviteUrl: `${baseUrl}/invite/${invitation.token}`,
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
