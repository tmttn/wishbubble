import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendSecretSantaNotification } from "@/lib/email";
import { createNotification } from "@/lib/notifications";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/bubbles/[id]/draw - Perform Secret Santa draw
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: bubbleId } = await params;

    // Get bubble with members and exclusions
    const bubble = await prisma.bubble.findUnique({
      where: { id: bubbleId },
      include: {
        members: {
          where: { leftAt: null },
          include: {
            user: {
              select: { id: true, name: true, email: true, locale: true },
            },
          },
        },
        secretSantaDraws: true,
      },
    });

    if (!bubble) {
      return NextResponse.json({ error: "Bubble not found" }, { status: 404 });
    }

    // Check permissions
    const isOwner = bubble.ownerId === session.user.id;
    const membership = bubble.members.find((m) => m.userId === session.user.id);
    const isAdmin = membership?.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Only the owner or admin can trigger the draw" },
        { status: 403 }
      );
    }

    // Check if already drawn
    if (bubble.secretSantaDrawn) {
      return NextResponse.json(
        { error: "Secret Santa has already been drawn for this bubble" },
        { status: 400 }
      );
    }

    // Need at least 3 members for a proper draw
    if (bubble.members.length < 3) {
      return NextResponse.json(
        { error: "Need at least 3 members to do a Secret Santa draw" },
        { status: 400 }
      );
    }

    // Get exclusion rules
    const exclusions = await prisma.secretSantaExclusion.findMany({
      where: { bubbleId },
    });

    // Build exclusion map
    const exclusionMap = new Map<string, Set<string>>();
    for (const ex of exclusions) {
      if (!exclusionMap.has(ex.userId1)) {
        exclusionMap.set(ex.userId1, new Set());
      }
      if (!exclusionMap.has(ex.userId2)) {
        exclusionMap.set(ex.userId2, new Set());
      }
      exclusionMap.get(ex.userId1)!.add(ex.userId2);
      exclusionMap.get(ex.userId2)!.add(ex.userId1);
    }

    // Perform the draw
    const members = bubble.members.map((m) => m.user);
    const assignments = performDraw(members, exclusionMap);

    if (!assignments) {
      return NextResponse.json(
        {
          error:
            "Could not create valid assignments with current exclusion rules. Try removing some exclusions.",
        },
        { status: 400 }
      );
    }

    // Save assignments and mark as drawn
    await prisma.$transaction([
      // Create draw records
      ...assignments.map(({ giverId, receiverId }) =>
        prisma.secretSantaDraw.create({
          data: {
            bubbleId,
            giverId,
            receiverId,
            excludedUserIds: Array.from(exclusionMap.get(giverId) || []),
          },
        })
      ),
      // Mark bubble as drawn
      prisma.bubble.update({
        where: { id: bubbleId },
        data: { secretSantaDrawn: true },
      }),
      // Create activity
      prisma.activity.create({
        data: {
          bubbleId,
          userId: session.user.id,
          type: "SECRET_SANTA_DRAWN",
        },
      }),
    ]);

    // Send email and in-app notifications
    const baseUrl = process.env.NEXTAUTH_URL || "https://wishbubble.app";
    for (const { giverId, receiverId } of assignments) {
      const giver = members.find((m) => m.id === giverId);
      const receiver = members.find((m) => m.id === receiverId);

      if (giver?.email && receiver) {
        try {
          await sendSecretSantaNotification({
            to: giver.email,
            receiverName: receiver.name || "Someone",
            bubbleName: bubble.name,
            bubbleUrl: `${baseUrl}/bubbles/${bubble.id}/secret-santa`,
            locale: giver.locale,
          });
        } catch (emailError) {
          console.error(`Failed to send email to ${giver.email}:`, emailError);
        }
      }

      // Create in-app notification
      await createNotification({
        userId: giverId,
        type: "SECRET_SANTA_DRAWN",
        title: `Secret Santa draw for ${bubble.name}`,
        body: `Names have been drawn! Click to see who you're buying for.`,
        bubbleId,
      });
    }

    return NextResponse.json({
      success: true,
      assignmentCount: assignments.length,
    });
  } catch (error) {
    console.error("Error performing Secret Santa draw:", error);
    return NextResponse.json(
      { error: "Failed to perform draw" },
      { status: 500 }
    );
  }
}

// Fisher-Yates shuffle with derangement (no one gets themselves)
// Also respects exclusion rules
function performDraw(
  members: { id: string; name: string | null; email: string; locale: string }[],
  exclusionMap: Map<string, Set<string>>,
  maxAttempts = 1000
): { giverId: string; receiverId: string }[] | null {
  const memberIds = members.map((m) => m.id);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const receivers = [...memberIds];
    shuffleArray(receivers);

    let valid = true;
    const assignments: { giverId: string; receiverId: string }[] = [];

    for (let i = 0; i < memberIds.length; i++) {
      const giverId = memberIds[i];
      const receiverId = receivers[i];

      // Can't give to yourself
      if (giverId === receiverId) {
        valid = false;
        break;
      }

      // Check exclusion rules
      const exclusions = exclusionMap.get(giverId);
      if (exclusions?.has(receiverId)) {
        valid = false;
        break;
      }

      assignments.push({ giverId, receiverId });
    }

    if (valid) {
      return assignments;
    }
  }

  return null;
}

function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// DELETE /api/bubbles/[id]/draw - Reset Secret Santa draw (redraw capability)
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: bubbleId } = await params;

    // Get bubble
    const bubble = await prisma.bubble.findUnique({
      where: { id: bubbleId },
      include: {
        members: {
          where: { leftAt: null },
        },
      },
    });

    if (!bubble) {
      return NextResponse.json({ error: "Bubble not found" }, { status: 404 });
    }

    // Check permissions - only owner or admin can reset
    const isOwner = bubble.ownerId === session.user.id;
    const membership = bubble.members.find((m) => m.userId === session.user.id);
    const isAdmin = membership?.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Only the owner or admin can reset the draw" },
        { status: 403 }
      );
    }

    // Check if there's a draw to reset
    if (!bubble.secretSantaDrawn) {
      return NextResponse.json(
        { error: "No Secret Santa draw to reset" },
        { status: 400 }
      );
    }

    // Delete all draw records and reset the bubble
    await prisma.$transaction([
      // Delete all Secret Santa draw records
      prisma.secretSantaDraw.deleteMany({
        where: { bubbleId },
      }),
      // Reset the drawn flag
      prisma.bubble.update({
        where: { id: bubbleId },
        data: { secretSantaDrawn: false },
      }),
      // Create activity log
      prisma.activity.create({
        data: {
          bubbleId,
          userId: session.user.id,
          type: "SECRET_SANTA_RESET",
          metadata: {
            resetBy: session.user.name,
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Secret Santa draw has been reset",
    });
  } catch (error) {
    console.error("Error resetting Secret Santa draw:", error);
    return NextResponse.json(
      { error: "Failed to reset draw" },
      { status: 500 }
    );
  }
}

// GET /api/bubbles/[id]/draw - Get current user's assignment
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

    const draw = await prisma.secretSantaDraw.findFirst({
      where: {
        bubbleId,
        giverId: session.user.id,
      },
      include: {
        receiver: {
          select: { id: true, name: true, image: true, avatarUrl: true },
        },
      },
    });

    if (!draw) {
      return NextResponse.json({ assignment: null });
    }

    // Mark as viewed if first time
    if (!draw.viewedAt) {
      await prisma.secretSantaDraw.update({
        where: { id: draw.id },
        data: { viewedAt: new Date() },
      });
    }

    return NextResponse.json({
      assignment: {
        receiver: draw.receiver,
        viewedAt: draw.viewedAt || new Date(),
      },
    });
  } catch (error) {
    console.error("Error fetching assignment:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignment" },
      { status: 500 }
    );
  }
}
