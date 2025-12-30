import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

interface RouteParams {
  params: Promise<{ token: string }>;
}

// GET /api/invite/[token] - Get invitation details
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { token } = await params;

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        bubble: {
          select: {
            id: true,
            name: true,
            description: true,
            occasionType: true,
            eventDate: true,
            _count: { select: { members: true } },
          },
        },
        inviter: {
          select: { name: true },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    if (invitation.status !== "PENDING") {
      return NextResponse.json(
        { error: "Invitation is no longer valid", status: invitation.status },
        { status: 400 }
      );
    }

    if (invitation.expiresAt < new Date()) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json(
        { error: "Invitation has expired" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      bubble: invitation.bubble,
      inviterName: invitation.inviter.name,
      email: invitation.email,
    });
  } catch (error) {
    console.error("Error fetching invitation:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitation" },
      { status: 500 }
    );
  }
}

// POST /api/invite/[token] - Accept invitation
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await params;

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        bubble: true,
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    if (invitation.status !== "PENDING") {
      return NextResponse.json(
        { error: "Invitation is no longer valid" },
        { status: 400 }
      );
    }

    if (invitation.expiresAt < new Date()) {
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json(
        { error: "Invitation has expired" },
        { status: 400 }
      );
    }

    // Check if already a member
    const existingMember = await prisma.bubbleMember.findFirst({
      where: {
        bubbleId: invitation.bubbleId,
        userId: session.user.id,
        leftAt: null,
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "You are already a member of this bubble" },
        { status: 400 }
      );
    }

    // Add user to bubble
    await prisma.$transaction([
      prisma.bubbleMember.create({
        data: {
          bubbleId: invitation.bubbleId,
          userId: session.user.id,
          role: "MEMBER",
        },
      }),
      prisma.invitation.update({
        where: { id: invitation.id },
        data: {
          status: "ACCEPTED",
          acceptedAt: new Date(),
        },
      }),
      // Create activity log
      prisma.activity.create({
        data: {
          bubbleId: invitation.bubbleId,
          userId: session.user.id,
          type: "MEMBER_JOINED",
          metadata: {
            userName: session.user.name,
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      bubbleId: invitation.bubbleId,
    });
  } catch (error) {
    console.error("Error accepting invitation:", error);
    return NextResponse.json(
      { error: "Failed to accept invitation" },
      { status: 500 }
    );
  }
}
