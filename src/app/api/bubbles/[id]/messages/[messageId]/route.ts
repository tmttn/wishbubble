import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

// DELETE /api/bubbles/[id]/messages/[messageId] - Delete a message (soft delete)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: bubbleId, messageId } = await params;

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

    // Get the message
    const message = await prisma.bubbleMessage.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        userId: true,
        bubbleId: true,
        deletedAt: true,
      },
    });

    if (!message || message.bubbleId !== bubbleId) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      );
    }

    if (message.deletedAt) {
      return NextResponse.json(
        { error: "Message already deleted" },
        { status: 400 }
      );
    }

    // Check permissions: owner can delete own messages, admins/owners can delete any
    const isOwnMessage = message.userId === session.user.id;
    const isAdminOrOwner = ["OWNER", "ADMIN"].includes(membership.role);

    if (!isOwnMessage && !isAdminOrOwner) {
      return NextResponse.json(
        { error: "Not authorized to delete this message" },
        { status: 403 }
      );
    }

    // Soft delete the message
    await prisma.bubbleMessage.update({
      where: { id: messageId },
      data: { deletedAt: new Date() },
    });

    logger.info("Message deleted", {
      bubbleId,
      messageId,
      deletedBy: session.user.id,
      wasOwnMessage: isOwnMessage,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error deleting message", error);
    return NextResponse.json(
      { error: "Failed to delete message" },
      { status: 500 }
    );
  }
}
