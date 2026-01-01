import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * DELETE /api/user/delete
 *
 * Permanently delete user account and all associated data.
 * This is for GDPR compliance - users have the right to be forgotten.
 */
export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Verify the deletion request with password or confirmation
    const body = await request.json().catch(() => ({}));
    const { confirmation } = body;

    if (confirmation !== "DELETE") {
      return NextResponse.json(
        { error: "Please type DELETE to confirm account deletion" },
        { status: 400 }
      );
    }

    // Check if user owns any bubbles - they must transfer ownership first
    const ownedBubbles = await prisma.bubble.findMany({
      where: {
        ownerId: userId,
        archivedAt: null,
      },
      select: { id: true, name: true },
    });

    if (ownedBubbles.length > 0) {
      return NextResponse.json(
        {
          error: "You must transfer or delete your groups before deleting your account",
          bubbles: ownedBubbles,
        },
        { status: 400 }
      );
    }

    // Delete all user data in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete notifications
      await tx.notification.deleteMany({ where: { userId } });

      // Delete activities (set userId to null for historical records)
      await tx.activity.updateMany({
        where: { userId },
        data: { userId: null },
      });

      // Delete claims
      await tx.claim.deleteMany({ where: { userId } });

      // Delete Secret Santa draws where user is giver or receiver
      await tx.secretSantaDraw.deleteMany({
        where: {
          OR: [{ giverId: userId }, { receiverId: userId }],
        },
      });

      // Delete bubble memberships
      await tx.bubbleMember.deleteMany({ where: { userId } });

      // Delete invitations sent by user
      await tx.invitation.deleteMany({ where: { invitedBy: userId } });

      // Delete wishlist items (cascade from wishlists)
      const userWishlists = await tx.wishlist.findMany({
        where: { userId },
        select: { id: true },
      });

      const wishlistIds = userWishlists.map((w) => w.id);

      // Delete bubble-wishlist associations
      await tx.bubbleWishlist.deleteMany({
        where: { wishlistId: { in: wishlistIds } },
      });

      // Delete wishlist items
      await tx.wishlistItem.deleteMany({
        where: { wishlistId: { in: wishlistIds } },
      });

      // Delete wishlists
      await tx.wishlist.deleteMany({ where: { userId } });

      // Delete sessions
      await tx.session.deleteMany({ where: { userId } });

      // Delete accounts (OAuth connections)
      await tx.account.deleteMany({ where: { userId } });

      // Finally, delete the user
      await tx.user.delete({ where: { id: userId } });
    });

    return NextResponse.json({
      success: true,
      message: "Your account has been permanently deleted",
    });
  } catch (error) {
    logger.error("Error deleting user account", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
