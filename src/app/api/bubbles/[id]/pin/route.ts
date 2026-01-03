import { NextResponse } from "next/server";
import { auth, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { compare, hash } from "bcryptjs";
import { logger } from "@/lib/logger";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/bubbles/[id]/pin - Check if current user has PIN protection for this bubble
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get membership and user info
    const [membership, user, bubble] = await Promise.all([
      prisma.bubbleMember.findFirst({
        where: {
          bubbleId: id,
          userId: session.user.id,
          leftAt: null,
        },
        select: {
          id: true,
          pinHash: true,
          pinEnabledAt: true,
        },
      }),
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { passwordHash: true },
      }),
      prisma.bubble.findUnique({
        where: { id },
        select: { isSecretSanta: true },
      }),
    ]);

    if (!membership) {
      return NextResponse.json({ error: "Not a member of this bubble" }, { status: 403 });
    }

    if (!bubble) {
      return NextResponse.json({ error: "Bubble not found" }, { status: 404 });
    }

    return NextResponse.json({
      hasPinProtection: !!membership.pinHash,
      pinEnabledAt: membership.pinEnabledAt,
      isSecretSanta: bubble.isSecretSanta,
      hasPassword: !!user?.passwordHash, // OAuth-only users won't have a password
    });
  } catch (error) {
    logger.error("Error checking bubble PIN status", error);
    return NextResponse.json(
      { error: "Failed to check PIN status" },
      { status: 500 }
    );
  }
}

// POST /api/bubbles/[id]/pin - Set or update personal PIN for this bubble
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { pin, password, currentPin } = body;

    // Validate PIN format (4-6 digits)
    if (!pin || !/^\d{4,6}$/.test(pin)) {
      return NextResponse.json(
        { error: "PIN must be 4-6 digits" },
        { status: 400 }
      );
    }

    // Get membership and user info
    const [membership, user] = await Promise.all([
      prisma.bubbleMember.findFirst({
        where: {
          bubbleId: id,
          userId: session.user.id,
          leftAt: null,
        },
        select: {
          id: true,
          pinHash: true,
        },
      }),
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          passwordHash: true,
        },
      }),
    ]);

    if (!membership) {
      return NextResponse.json({ error: "Not a member of this bubble" }, { status: 403 });
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If PIN already exists, require current PIN to change it
    if (membership.pinHash) {
      if (!currentPin) {
        return NextResponse.json(
          { error: "Current PIN is required to change PIN" },
          { status: 400 }
        );
      }

      const isCurrentPinValid = await compare(currentPin, membership.pinHash);
      if (!isCurrentPinValid) {
        return NextResponse.json(
          { error: "Current PIN is incorrect" },
          { status: 401 }
        );
      }
    } else {
      // If setting PIN for the first time, require password verification (if user has password)
      // OAuth-only users can set PIN without password verification
      if (user.passwordHash) {
        if (!password) {
          return NextResponse.json(
            { error: "Password is required to set a PIN" },
            { status: 400 }
          );
        }

        const isPasswordValid = await verifyPassword(password, user.passwordHash);
        if (!isPasswordValid) {
          return NextResponse.json(
            { error: "Password is incorrect" },
            { status: 401 }
          );
        }
      }
      // OAuth-only users skip password verification - they're already authenticated via OAuth
    }

    // Hash and save the new PIN
    const pinHash = await hash(pin, 12);

    await prisma.bubbleMember.update({
      where: { id: membership.id },
      data: {
        pinHash,
        pinEnabledAt: membership.pinHash ? undefined : new Date(), // Only set if first time
      },
    });

    // Log activity - personal PIN change
    await prisma.activity.create({
      data: {
        type: "GROUP_UPDATED",
        userId: session.user.id,
        bubbleId: id,
        metadata: {
          action: membership.pinHash ? "pin_changed" : "pin_enabled",
          personal: true, // Mark as personal PIN action
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: membership.pinHash ? "PIN updated successfully" : "PIN protection enabled",
    });
  } catch (error) {
    logger.error("Error setting bubble PIN", error);
    return NextResponse.json(
      { error: "Failed to set PIN" },
      { status: 500 }
    );
  }
}

// DELETE /api/bubbles/[id]/pin - Remove personal PIN protection
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { currentPin } = body;

    if (!currentPin) {
      return NextResponse.json(
        { error: "Current PIN is required to remove PIN protection" },
        { status: 400 }
      );
    }

    // Get membership
    const membership = await prisma.bubbleMember.findFirst({
      where: {
        bubbleId: id,
        userId: session.user.id,
        leftAt: null,
      },
      select: {
        id: true,
        pinHash: true,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Not a member of this bubble" }, { status: 403 });
    }

    if (!membership.pinHash) {
      return NextResponse.json(
        { error: "You do not have PIN protection for this bubble" },
        { status: 400 }
      );
    }

    // Verify current PIN
    const isCurrentPinValid = await compare(currentPin, membership.pinHash);
    if (!isCurrentPinValid) {
      return NextResponse.json(
        { error: "Current PIN is incorrect" },
        { status: 401 }
      );
    }

    // Remove PIN
    await prisma.bubbleMember.update({
      where: { id: membership.id },
      data: {
        pinHash: null,
        pinEnabledAt: null,
      },
    });

    // Log activity - personal PIN removal
    await prisma.activity.create({
      data: {
        type: "GROUP_UPDATED",
        userId: session.user.id,
        bubbleId: id,
        metadata: {
          action: "pin_disabled",
          personal: true, // Mark as personal PIN action
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "PIN protection removed",
    });
  } catch (error) {
    logger.error("Error removing bubble PIN", error);
    return NextResponse.json(
      { error: "Failed to remove PIN" },
      { status: 500 }
    );
  }
}
