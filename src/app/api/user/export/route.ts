import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/user/export - Export all user data (GDPR data portability)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch all user data in parallel
    const [
      user,
      wishlists,
      bubbleMemberships,
      claims,
      notifications,
      activities,
      invitationsSent,
    ] = await Promise.all([
      // User profile
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          avatarUrl: true,
          notifyEmail: true,
          notifyInApp: true,
          notifyDigest: true,
          digestDay: true,
          emailOnMemberJoined: true,
          emailOnSecretSantaDraw: true,
          emailOnEventReminder: true,
          subscriptionTier: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
        },
      }),

      // Wishlists with items
      prisma.wishlist.findMany({
        where: { userId },
        include: {
          items: {
            where: { deletedAt: null },
            select: {
              id: true,
              title: true,
              description: true,
              price: true,
              priceMax: true,
              currency: true,
              url: true,
              imageUrl: true,
              priority: true,
              quantity: true,
              category: true,
              notes: true,
              sortOrder: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          bubbles: {
            select: {
              bubble: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
              isVisible: true,
              attachedAt: true,
            },
          },
        },
      }),

      // Bubble memberships
      prisma.bubbleMember.findMany({
        where: { userId, leftAt: null },
        include: {
          bubble: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              occasionType: true,
              eventDate: true,
              budgetMin: true,
              budgetMax: true,
              currency: true,
              isSecretSanta: true,
              createdAt: true,
              ownerId: true,
            },
          },
        },
      }),

      // Claims made by user
      prisma.claim.findMany({
        where: { userId },
        include: {
          item: {
            select: {
              id: true,
              title: true,
              price: true,
              currency: true,
              wishlist: {
                select: {
                  user: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
          bubble: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      }),

      // Notifications
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 500, // Limit to last 500 notifications
        select: {
          id: true,
          type: true,
          title: true,
          body: true,
          bubbleId: true,
          itemId: true,
          readAt: true,
          createdAt: true,
        },
      }),

      // Activity log
      prisma.activity.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 500, // Limit to last 500 activities
        select: {
          id: true,
          type: true,
          bubbleId: true,
          metadata: true,
          createdAt: true,
        },
      }),

      // Invitations sent
      prisma.invitation.findMany({
        where: { invitedBy: userId },
        select: {
          id: true,
          email: true,
          status: true,
          sentAt: true,
          acceptedAt: true,
          bubble: {
            select: {
              name: true,
            },
          },
        },
      }),
    ]);

    // Get Secret Santa draws where user is a giver
    const secretSantaDraws = await prisma.secretSantaDraw.findMany({
      where: { giverId: userId },
      select: {
        id: true,
        bubble: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        receiver: {
          select: {
            name: true,
          },
        },
        drawnAt: true,
        viewedAt: true,
      },
    });

    // Get bubbles owned by user
    const ownedBubbles = await prisma.bubble.findMany({
      where: { ownerId: userId },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        occasionType: true,
        eventDate: true,
        createdAt: true,
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    // Format the export data
    const exportData = {
      exportedAt: new Date().toISOString(),
      gdprInfo: {
        description:
          "This file contains all personal data we hold about you, as required by GDPR Article 20 (Right to Data Portability).",
        dataController: "WishBubble",
        contact: "privacy@wishbubble.app",
      },
      profile: user,
      wishlists: wishlists.map((w) => ({
        id: w.id,
        name: w.name,
        description: w.description,
        isDefault: w.isDefault,
        createdAt: w.createdAt,
        updatedAt: w.updatedAt,
        items: w.items,
        sharedInBubbles: w.bubbles.map((b) => ({
          bubbleId: b.bubble.id,
          bubbleName: b.bubble.name,
          isVisible: b.isVisible,
          attachedAt: b.attachedAt,
        })),
      })),
      bubbles: {
        owned: ownedBubbles.map((b) => ({
          ...b,
          memberCount: b._count.members,
        })),
        memberOf: bubbleMemberships.map((m) => ({
          role: m.role,
          joinedAt: m.joinedAt,
          bubble: m.bubble,
        })),
      },
      claims: claims.map((c) => ({
        id: c.id,
        status: c.status,
        quantity: c.quantity,
        isGroupGift: c.isGroupGift,
        contribution: c.contribution,
        claimedAt: c.claimedAt,
        purchasedAt: c.purchasedAt,
        item: {
          id: c.item.id,
          title: c.item.title,
          price: c.item.price,
          currency: c.item.currency,
          wishlistOwner: c.item.wishlist.user.name,
        },
        bubble: c.bubble,
      })),
      secretSantaAssignments: secretSantaDraws.map((d) => ({
        bubbleId: d.bubble.id,
        bubbleName: d.bubble.name,
        assignedTo: d.receiver.name,
        drawnAt: d.drawnAt,
        viewedAt: d.viewedAt,
      })),
      invitationsSent: invitationsSent.map((i) => ({
        email: i.email,
        bubbleName: i.bubble.name,
        status: i.status,
        sentAt: i.sentAt,
        acceptedAt: i.acceptedAt,
      })),
      notifications: notifications,
      activityLog: activities,
    };

    // Return as downloadable JSON
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="wishbubble-data-export-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (error) {
    console.error("Error exporting user data:", error);
    return NextResponse.json(
      { error: "Failed to export user data" },
      { status: 500 }
    );
  }
}
