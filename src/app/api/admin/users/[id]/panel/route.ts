import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/users/[id]/panel
 * Get user data optimized for the detail panel view
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

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        avatarUrl: true,
        subscriptionTier: true,
        isAdmin: true,
        createdAt: true,
        lastLoginAt: true,
        emailVerified: true,
        suspendedAt: true,
        suspendedUntil: true,
        suspensionReason: true,
        bubbleMemberships: {
          where: { leftAt: null },
          select: {
            role: true,
            bubble: {
              select: {
                id: true,
                name: true,
                occasionType: true,
                archivedAt: true,
                _count: { select: { members: true } },
              },
            },
          },
          orderBy: { joinedAt: "desc" },
          take: 10,
        },
        wishlists: {
          select: {
            id: true,
            name: true,
            isDefault: true,
            _count: { select: { items: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        claims: {
          where: { status: { in: ["CLAIMED", "PURCHASED"] } },
          select: {
            id: true,
            status: true,
            claimedAt: true,
            item: {
              select: { id: true, title: true },
            },
            bubble: {
              select: { id: true, name: true },
            },
          },
          orderBy: { claimedAt: "desc" },
          take: 5,
        },
        ownedBubbles: {
          where: { archivedAt: null },
          select: { id: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Transform for response
    const response = {
      ...user,
      createdAt: user.createdAt.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString() || null,
      emailVerified: user.emailVerified?.toISOString() || null,
      suspendedAt: user.suspendedAt?.toISOString() || null,
      suspendedUntil: user.suspendedUntil?.toISOString() || null,
      bubbleMemberships: user.bubbleMemberships.map((m) => ({
        ...m,
        bubble: {
          ...m.bubble,
          archivedAt: m.bubble.archivedAt?.toISOString() || null,
        },
      })),
      claims: user.claims.map((c) => ({
        ...c,
        claimedAt: c.claimedAt.toISOString(),
      })),
      ownedBubblesCount: user.ownedBubbles.length,
      ownedBubbles: undefined,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching user panel data:", error);
    return NextResponse.json(
      { error: "Failed to fetch user data" },
      { status: 500 }
    );
  }
}
