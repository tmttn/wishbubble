import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin";
import { cancelSubscriptionImmediately } from "@/lib/stripe";
import { logger } from "@/lib/logger";
import { sendAccountTerminatedEmail } from "@/lib/email";

const deleteSchema = z.object({
  confirmation: z.string(),
  reason: z.string().min(1).max(500).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * DELETE /api/admin/users/[id]
 * Permanently delete a user account (admin action)
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const adminCheck = await requireAdminApi();
    if (adminCheck.error) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.status }
      );
    }
    // TypeScript doesn't narrow this properly, but we know session is not null after the error check
    const adminSession = adminCheck.session!;

    const { id } = await params;
    const body = await request.json();

    const validation = deleteSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Confirmation required" },
        { status: 400 }
      );
    }

    const { reason } = validation.data;

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        locale: true,
        isAdmin: true,
        subscriptionTier: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent deleting admins
    if (user.isAdmin) {
      return NextResponse.json(
        { error: "Cannot delete admin users" },
        { status: 400 }
      );
    }

    // Verify confirmation matches user email
    if (validation.data.confirmation !== user.email) {
      return NextResponse.json(
        { error: "Please type the user's email to confirm deletion" },
        { status: 400 }
      );
    }

    // Check if user owns any active groups
    const ownedBubbles = await prisma.bubble.findMany({
      where: {
        ownerId: id,
        archivedAt: null,
      },
      select: { id: true, name: true },
    });

    if (ownedBubbles.length > 0) {
      return NextResponse.json(
        {
          error: "User owns active groups. Transfer or delete these groups first.",
          bubbles: ownedBubbles,
        },
        { status: 400 }
      );
    }

    // Cancel any active subscription immediately
    const hadSubscription = user.subscriptionTier !== "FREE";
    if (hadSubscription) {
      await cancelSubscriptionImmediately(id);
    }

    // Send notification email before deleting (so we have their email)
    await sendAccountTerminatedEmail({
      to: user.email,
      reason: reason || "Terms of Service violation",
      hadSubscription,
      locale: user.locale || "en",
    });

    // Log the deletion before removing data
    await prisma.activity.create({
      data: {
        type: "USER_DELETED_BY_ADMIN",
        userId: null, // User will be deleted, so don't reference
        metadata: {
          deletedUserId: id,
          deletedUserEmail: user.email,
          deletedUserName: user.name,
          reason: reason || "Terms of Service violation",
          hadSubscription,
          adminId: adminSession.user.id,
          adminEmail: adminSession.user.email,
        },
      },
    });

    // Delete all user data in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete notifications
      await tx.notification.deleteMany({ where: { userId: id } });

      // Update activities (set userId to null for historical records)
      await tx.activity.updateMany({
        where: { userId: id },
        data: { userId: null },
      });

      // Delete claims
      await tx.claim.deleteMany({ where: { userId: id } });

      // Delete Secret Santa draws where user is giver or receiver
      await tx.secretSantaDraw.deleteMany({
        where: {
          OR: [{ giverId: id }, { receiverId: id }],
        },
      });

      // Delete bubble memberships
      await tx.bubbleMember.deleteMany({ where: { userId: id } });

      // Delete invitations sent by user
      await tx.invitation.deleteMany({ where: { invitedBy: id } });

      // Get user wishlists
      const userWishlists = await tx.wishlist.findMany({
        where: { userId: id },
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
      await tx.wishlist.deleteMany({ where: { userId: id } });

      // Delete subscription record
      await tx.subscription.deleteMany({ where: { userId: id } });

      // Delete transactions
      await tx.transaction.deleteMany({ where: { userId: id } });

      // Delete sessions
      await tx.session.deleteMany({ where: { userId: id } });

      // Delete accounts (OAuth connections)
      await tx.account.deleteMany({ where: { userId: id } });

      // Finally, delete the user
      await tx.user.delete({ where: { id } });
    });

    logger.info("User deleted by admin", {
      deletedUserId: id,
      deletedUserEmail: user.email,
      adminId: adminSession.user.id,
    });

    return NextResponse.json({
      success: true,
      message: "User account has been permanently deleted",
    });
  } catch (error) {
    logger.error("Error deleting user", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
