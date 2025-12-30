import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

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

    // Determine user's role
    const isOwner = bubble.ownerId === session.user.id;
    const isAdmin = membership.role === "ADMIN" || membership.role === "OWNER";

    return NextResponse.json({
      ...bubble,
      isOwner,
      isAdmin,
      currentUserRole: membership.role,
    });
  } catch (error) {
    console.error("Error fetching bubble:", error);
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
    console.error("Error updating bubble:", error);
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

    // Only owner can delete
    const bubble = await prisma.bubble.findUnique({
      where: { id },
      select: { ownerId: true },
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting bubble:", error);
    return NextResponse.json(
      { error: "Failed to delete bubble" },
      { status: 500 }
    );
  }
}
