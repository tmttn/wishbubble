import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { z } from "zod";
import { createLocalizedBulkNotifications } from "@/lib/notifications";
import { NotificationType } from "@prisma/client";
import { sendMentionEmail } from "@/lib/email";

const createMessageSchema = z.object({
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(2000, "Message too long (max 2000 characters)"),
  mentions: z.array(z.string()).optional(),
});

// GET /api/bubbles/[id]/messages - Get paginated messages
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: bubbleId } = await params;
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor");
    const after = searchParams.get("after"); // For polling - get messages after this ID
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    // Check if user is a member of this bubble
    const membership = await prisma.bubbleMember.findUnique({
      where: {
        bubbleId_userId: {
          bubbleId,
          userId: session.user.id,
        },
      },
    });

    if (!membership || membership.leftAt) {
      return NextResponse.json(
        { error: "Not a member of this bubble" },
        { status: 403 }
      );
    }

    // If "after" parameter is provided, get new messages since that ID (for polling)
    if (after) {
      // Get the reference message to get its createdAt
      const refMessage = await prisma.bubbleMessage.findUnique({
        where: { id: after },
        select: { createdAt: true },
      });

      if (!refMessage) {
        return NextResponse.json({ messages: [] });
      }

      const newMessages = await prisma.bubbleMessage.findMany({
        where: {
          bubbleId,
          deletedAt: null,
          createdAt: { gt: refMessage.createdAt },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              avatarUrl: true,
              subscriptionTier: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
        take: 50, // Limit to 50 new messages per poll
      });

      return NextResponse.json({ messages: newMessages });
    }

    // Get messages with pagination (newest first for initial load)
    const messages = await prisma.bubbleMessage.findMany({
      where: {
        bubbleId,
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            avatarUrl: true,
            subscriptionTier: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1, // Get one extra to check if there are more
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1, // Skip the cursor itself
      }),
    });

    const hasMore = messages.length > limit;
    const items = hasMore ? messages.slice(0, -1) : messages;
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    return NextResponse.json({
      messages: items.reverse(), // Return in chronological order
      nextCursor,
      hasMore,
    });
  } catch (error) {
    logger.error("Error fetching messages", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// POST /api/bubbles/[id]/messages - Send a message
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: bubbleId } = await params;
    const body = await request.json();
    const validatedData = createMessageSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: validatedData.error.issues[0].message },
        { status: 400 }
      );
    }

    // Check if user is a member of this bubble
    const membership = await prisma.bubbleMember.findUnique({
      where: {
        bubbleId_userId: {
          bubbleId,
          userId: session.user.id,
        },
      },
    });

    if (!membership || membership.leftAt) {
      return NextResponse.json(
        { error: "Not a member of this bubble" },
        { status: 403 }
      );
    }

    // Check if bubble is archived and get bubble details
    const bubble = await prisma.bubble.findUnique({
      where: { id: bubbleId },
      select: {
        archivedAt: true,
        name: true,
        members: {
          where: { leftAt: null },
          select: { userId: true },
        },
      },
    });

    if (!bubble) {
      return NextResponse.json(
        { error: "Bubble not found" },
        { status: 404 }
      );
    }

    if (bubble.archivedAt) {
      return NextResponse.json(
        { error: "Cannot send messages to archived bubble" },
        { status: 400 }
      );
    }

    // Filter mentions to only include valid bubble members
    const validMentions = validatedData.data.mentions?.filter((userId) =>
      bubble.members.some((m) => m.userId === userId && m.userId !== session.user.id)
    ) || [];

    // Create the message
    const message = await prisma.bubbleMessage.create({
      data: {
        bubbleId,
        userId: session.user.id,
        content: validatedData.data.content,
        mentions: validMentions,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            avatarUrl: true,
            subscriptionTier: true,
          },
        },
      },
    });

    logger.info("Message sent", {
      bubbleId,
      userId: session.user.id,
      messageId: message.id,
    });

    // Send notifications to bubble members (async, don't block)
    if (bubble?.members) {
      const otherMemberIds = bubble.members
        .filter((m) => m.userId !== session.user.id)
        .map((m) => m.userId);

      // Truncate message for notification
      const truncatedContent =
        validatedData.data.content.length > 100
          ? validatedData.data.content.substring(0, 100) + "..."
          : validatedData.data.content;

      // Send mention notifications (higher priority)
      if (validMentions.length > 0) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://wish-bubble.app";

        createLocalizedBulkNotifications(validMentions, {
          type: NotificationType.BUBBLE_MESSAGE,
          messageType: "bubbleMention",
          messageParams: {
            senderName: session.user.name || "Someone",
            bubbleName: bubble.name,
            messagePreview: truncatedContent,
          },
          bubbleId,
          url: `/bubbles/${bubbleId}?tab=chat`,
        }).catch((err) => {
          logger.error("Failed to send mention notifications", err);
        });

        // Send email notifications to mentioned users who have email enabled
        prisma.user.findMany({
          where: {
            id: { in: validMentions },
            notifyEmail: true,
            deletedAt: null,
          },
          select: { id: true, email: true, locale: true },
        }).then((mentionedUsers) => {
          for (const user of mentionedUsers) {
            sendMentionEmail({
              to: user.email,
              senderName: session.user.name || "Someone",
              bubbleName: bubble.name,
              bubbleUrl: `${baseUrl}/bubbles/${bubbleId}?tab=chat`,
              messagePreview: truncatedContent,
              locale: user.locale || "en",
            }).catch((err) => {
              logger.error("Failed to send mention email", err, { userId: user.id });
            });
          }
        }).catch((err) => {
          logger.error("Failed to fetch mentioned users for email", err);
        });
      }

      // Send regular chat notifications to non-mentioned members
      const nonMentionedMemberIds = otherMemberIds.filter(
        (id) => !validMentions.includes(id)
      );

      if (nonMentionedMemberIds.length > 0) {
        createLocalizedBulkNotifications(nonMentionedMemberIds, {
          type: NotificationType.BUBBLE_MESSAGE,
          messageType: "bubbleMessage",
          messageParams: {
            senderName: session.user.name || "Someone",
            bubbleName: bubble.name,
            messagePreview: truncatedContent,
          },
          bubbleId,
          url: `/bubbles/${bubbleId}?tab=chat`,
        }).catch((err) => {
          logger.error("Failed to send chat notifications", err);
        });
      }
    }

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    logger.error("Error sending message", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
