import { NextResponse } from "next/server";
import { auth, verifyPassword, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { compare, hash } from "bcryptjs";
import { logger } from "@/lib/logger";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/bubbles/[id]/pin - Check if bubble has PIN protection
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

    // Get bubble PIN status
    const bubble = await prisma.bubble.findUnique({
      where: { id },
      select: {
        id: true,
        pinHash: true,
        pinEnabledAt: true,
        isSecretSanta: true,
      },
    });

    if (!bubble) {
      return NextResponse.json({ error: "Bubble not found" }, { status: 404 });
    }

    return NextResponse.json({
      hasPinProtection: !!bubble.pinHash,
      pinEnabledAt: bubble.pinEnabledAt,
      isSecretSanta: bubble.isSecretSanta,
    });
  } catch (error) {
    logger.error("Error checking bubble PIN status", error);
    return NextResponse.json(
      { error: "Failed to check PIN status" },
      { status: 500 }
    );
  }
}

// POST /api/bubbles/[id]/pin - Set or update PIN
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

    // Check if user is owner or admin
    const membership = await prisma.bubbleMember.findFirst({
      where: {
        bubbleId: id,
        userId: session.user.id,
        leftAt: null,
        role: { in: ["OWNER", "ADMIN"] },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Only owners and admins can set a PIN" },
        { status: 403 }
      );
    }

    // Get bubble and user info
    const [bubble, user] = await Promise.all([
      prisma.bubble.findUnique({
        where: { id },
        select: {
          id: true,
          pinHash: true,
          isSecretSanta: true,
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

    if (!bubble) {
      return NextResponse.json({ error: "Bubble not found" }, { status: 404 });
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If PIN already exists, require current PIN to change it
    if (bubble.pinHash) {
      if (!currentPin) {
        return NextResponse.json(
          { error: "Current PIN is required to change PIN" },
          { status: 400 }
        );
      }

      const isCurrentPinValid = await compare(currentPin, bubble.pinHash);
      if (!isCurrentPinValid) {
        return NextResponse.json(
          { error: "Current PIN is incorrect" },
          { status: 401 }
        );
      }
    } else {
      // If setting PIN for the first time, require password verification
      if (!password) {
        return NextResponse.json(
          { error: "Password is required to set a PIN" },
          { status: 400 }
        );
      }

      // Check if user has a password (might be OAuth-only)
      if (!user.passwordHash) {
        return NextResponse.json(
          { error: "You need to set a password first before setting a PIN" },
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

    // Hash and save the new PIN
    const pinHash = await hash(pin, 12);

    await prisma.bubble.update({
      where: { id },
      data: {
        pinHash,
        pinEnabledAt: bubble.pinHash ? undefined : new Date(), // Only set if first time
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        type: "GROUP_UPDATED",
        userId: session.user.id,
        bubbleId: id,
        metadata: {
          action: bubble.pinHash ? "pin_changed" : "pin_enabled",
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: bubble.pinHash ? "PIN updated successfully" : "PIN protection enabled",
    });
  } catch (error) {
    logger.error("Error setting bubble PIN", error);
    return NextResponse.json(
      { error: "Failed to set PIN" },
      { status: 500 }
    );
  }
}

// DELETE /api/bubbles/[id]/pin - Remove PIN protection
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

    // Check if user is owner or admin
    const membership = await prisma.bubbleMember.findFirst({
      where: {
        bubbleId: id,
        userId: session.user.id,
        leftAt: null,
        role: { in: ["OWNER", "ADMIN"] },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Only owners and admins can remove PIN protection" },
        { status: 403 }
      );
    }

    // Get bubble
    const bubble = await prisma.bubble.findUnique({
      where: { id },
      select: {
        id: true,
        pinHash: true,
      },
    });

    if (!bubble) {
      return NextResponse.json({ error: "Bubble not found" }, { status: 404 });
    }

    if (!bubble.pinHash) {
      return NextResponse.json(
        { error: "This bubble does not have PIN protection" },
        { status: 400 }
      );
    }

    // Verify current PIN
    const isCurrentPinValid = await compare(currentPin, bubble.pinHash);
    if (!isCurrentPinValid) {
      return NextResponse.json(
        { error: "Current PIN is incorrect" },
        { status: 401 }
      );
    }

    // Remove PIN
    await prisma.bubble.update({
      where: { id },
      data: {
        pinHash: null,
        pinEnabledAt: null,
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        type: "GROUP_UPDATED",
        userId: session.user.id,
        bubbleId: id,
        metadata: {
          action: "pin_disabled",
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
