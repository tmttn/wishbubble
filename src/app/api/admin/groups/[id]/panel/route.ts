import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/groups/[id]/panel
 * Get bubble/group data optimized for the detail panel view
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const adminCheck = await requireAdminApi();
    if (adminCheck.error) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    const { id } = await params;

    const bubble = await prisma.bubble.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        occasionType: true,
        eventDate: true,
        isPublic: true,
        secretSantaDrawn: true,
        archivedAt: true,
        createdAt: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: {
          where: { leftAt: null },
          select: {
            userId: true,
            role: true,
            joinedAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { joinedAt: "asc" },
          take: 10,
        },
        wishlists: {
          select: {
            wishlist: {
              select: {
                id: true,
                name: true,
                isDefault: true,
                user: {
                  select: { id: true, name: true },
                },
                _count: { select: { items: true } },
              },
            },
          },
          take: 5,
        },
        _count: {
          select: {
            members: true,
            wishlists: true,
            claims: true,
          },
        },
      },
    });

    if (!bubble) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Get recent activity for this bubble
    const recentActivity = await prisma.activity.findMany({
      where: { bubbleId: id },
      select: {
        id: true,
        type: true,
        createdAt: true,
        user: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Transform for response
    const response = {
      id: bubble.id,
      name: bubble.name,
      occasionType: bubble.occasionType,
      eventDate: bubble.eventDate?.toISOString() || null,
      visibility: bubble.isPublic ? "PUBLIC" : "PRIVATE",
      archivedAt: bubble.archivedAt?.toISOString() || null,
      createdAt: bubble.createdAt.toISOString(),
      owner: bubble.owner,
      members: bubble.members.map((m) => ({
        userId: m.userId,
        role: m.role,
        joinedAt: m.joinedAt.toISOString(),
        user: m.user,
      })),
      wishlists: bubble.wishlists.map((w) => ({
        id: w.wishlist.id,
        name: w.wishlist.name,
        isDefault: w.wishlist.isDefault,
        ownerName: w.wishlist.user.name,
        ownerId: w.wishlist.user.id,
        itemCount: w.wishlist._count.items,
      })),
      hasSecretSanta: bubble.secretSantaDrawn,
      counts: bubble._count,
      recentActivity: recentActivity.map((a) => ({
        id: a.id,
        type: a.type,
        createdAt: a.createdAt.toISOString(),
        userName: a.user?.name || null,
        userId: a.user?.id || null,
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching group panel data:", error);
    return NextResponse.json(
      { error: "Failed to fetch group data" },
      { status: 500 }
    );
  }
}
