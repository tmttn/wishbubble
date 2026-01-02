import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canAddMember } from "@/lib/plans";
import { createLocalizedBulkNotifications } from "@/lib/notifications";
import { sendGroupDeletedEmail } from "@/lib/email";
import { logger } from "@/lib/logger";
import { logBubbleAccess, sendAccessAlert } from "@/lib/bubble-access";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/bubbles/[id] - Get a single bubble
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if user is a member
    const membership = await prisma.bubbleMember.findFirst({
      where: {
        bubbleId: id,
        userId: session.user.id,
        leftAt: null,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Not a member of this bubble" }, { status: 403 });
    }

    const bubble = await prisma.bubble.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, avatarUrl: true, email: true },
        },
        members: {
          where: { leftAt: null },
          include: {
            user: {
              select: { id: true, name: true, avatarUrl: true, email: true },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
        wishlists: {
          where: { isVisible: true },
          include: {
            wishlist: {
              include: {
                user: {
                  select: { id: true, name: true, avatarUrl: true },
                },
                items: {
                  where: { deletedAt: null },
                  include: {
                    claims: {
                      where: {
                        bubbleId: id,
                        status: { not: "UNCLAIMED" },
                      },
                      include: {
                        user: {
                          select: { id: true, name: true, avatarUrl: true },
                        },
                      },
                    },
                  },
                  orderBy: [{ priority: "asc" }, { sortOrder: "asc" }],
                },
              },
            },
          },
        },
        _count: {
          select: {
            members: { where: { leftAt: null } },
            wishlists: { where: { isVisible: true } },
          },
        },
      },
    });

    if (!bubble) {
      return NextResponse.json({ error: "Bubble not found" }, { status: 404 });
    }

    // Log access for Secret Santa bubbles and send alerts for new devices
    if (bubble.isSecretSanta) {
      try {
        const { isNewDevice, accessLog } = await logBubbleAccess({
          bubbleId: id,
          userId: session.user.id,
          pinVerified: false, // Will be updated by verify-pin endpoint
        });

        // Send alert if this is a new device
        if (isNewDevice) {
          // Fire and forget - don't await
          sendAccessAlert({
            userId: session.user.id,
            bubbleId: id,
            bubbleName: bubble.name,
            deviceName: accessLog.deviceName,
            ipAddress: null, // Will be populated by sendAccessAlert
          }).catch((err) => logger.error("Failed to send access alert", err));
        }
      } catch (err) {
        // Don't fail the request if logging fails
        logger.error("Failed to log bubble access", err);
      }
    }

    // Determine user's role
    const isOwner = bubble.ownerId === session.user.id;
    const isAdmin = membership.role === "ADMIN" || membership.role === "OWNER";

    // Get member limit info (based on owner's plan)
    const memberLimitInfo = await canAddMember(bubble.ownerId, id);

    // Count pending invitations
    const pendingInviteCount = await prisma.invitation.count({
      where: {
        bubbleId: id,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
    });

    return NextResponse.json({
      ...bubble,
      isOwner,
      isAdmin,
      currentUserRole: membership.role,
      memberLimit: {
        current: memberLimitInfo.current,
        limit: memberLimitInfo.limit,
        pendingInvites: pendingInviteCount,
        canInvite: memberLimitInfo.allowed,
        upgradeRequired: memberLimitInfo.upgradeRequired,
      },
    });
  } catch (error) {
    logger.error("Error fetching bubble", error);
    return NextResponse.json(
      { error: "Failed to fetch bubble" },
      { status: 500 }
    );
  }
}

// PATCH /api/bubbles/[id] - Update a bubble
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if user is admin/owner
    const membership = await prisma.bubbleMember.findFirst({
      where: {
        bubbleId: id,
        userId: session.user.id,
        leftAt: null,
        role: { in: ["OWNER", "ADMIN"] },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Not authorized to update this bubble" }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      description,
      occasionType,
      eventDate,
      budgetMin,
      budgetMax,
      currency,
      isSecretSanta,
      maxMembers,
      revealGivers,
      allowMemberWishlists,
    } = body;

    const bubble = await prisma.bubble.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(occasionType && { occasionType }),
        ...(eventDate !== undefined && { eventDate: eventDate ? new Date(eventDate) : null }),
        ...(budgetMin !== undefined && { budgetMin }),
        ...(budgetMax !== undefined && { budgetMax }),
        ...(currency && { currency }),
        ...(isSecretSanta !== undefined && { isSecretSanta }),
        ...(maxMembers !== undefined && { maxMembers }),
        ...(revealGivers !== undefined && { revealGivers }),
        ...(allowMemberWishlists !== undefined && { allowMemberWishlists }),
      },
      include: {
        owner: {
          select: { id: true, name: true, avatarUrl: true },
        },
        members: {
          where: { leftAt: null },
          include: {
            user: {
              select: { id: true, name: true, avatarUrl: true },
            },
          },
        },
      },
    });

    return NextResponse.json(bubble);
  } catch (error) {
    logger.error("Error updating bubble", error);
    return NextResponse.json(
      { error: "Failed to update bubble" },
      { status: 500 }
    );
  }
}

// DELETE /api/bubbles/[id] - Archive a bubble
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Only owner can delete - fetch bubble with members for notifications
    const bubble = await prisma.bubble.findUnique({
      where: { id },
      select: {
        ownerId: true,
        name: true,
        members: {
          where: { leftAt: null },
          select: {
            userId: true,
            user: {
              select: {
                email: true,
                notifyEmail: true,
                locale: true,
              },
            },
          },
        },
      },
    });

    if (!bubble) {
      return NextResponse.json({ error: "Bubble not found" }, { status: 404 });
    }

    if (bubble.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Only the owner can delete this bubble" }, { status: 403 });
    }

    // Soft delete by archiving
    await prisma.bubble.update({
      where: { id },
      data: { archivedAt: new Date() },
    });

    // Notify other members (excluding the owner who deleted the group)
    const otherMembers = bubble.members.filter((m) => m.userId !== session.user.id);
    const memberUserIds = otherMembers.map((m) => m.userId);

    if (memberUserIds.length > 0) {
      // Create in-app notifications
      await createLocalizedBulkNotifications(memberUserIds, {
        type: "GROUP_DELETED",
        messageType: "bubbleDeleted",
        messageParams: {
          bubbleName: bubble.name,
          name: session.user.name || "The owner",
        },
      });

      // Send emails to members who have email notifications enabled
      const ownerName = session.user.name || "The owner";
      const emailPromises = otherMembers
        .filter((m) => m.user.notifyEmail && m.user.email)
        .map((m) =>
          sendGroupDeletedEmail({
            to: m.user.email!,
            bubbleName: bubble.name,
            ownerName,
            locale: m.user.locale || "en",
          })
        );

      // Send emails and log failures
      try {
        const results = await Promise.allSettled(emailPromises);
        const failures = results.filter((r) => r.status === "rejected");
        if (failures.length > 0) {
          logger.error("Some group deleted emails failed to send", undefined, {
            bubbleId: id,
            failureCount: failures.length,
            totalEmails: emailPromises.length,
          });
        }
      } catch (error) {
        logger.error("Error sending group deleted emails", error, { bubbleId: id });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error deleting bubble", error);
    return NextResponse.json(
      { error: "Failed to delete bubble" },
      { status: 500 }
    );
  }
}
