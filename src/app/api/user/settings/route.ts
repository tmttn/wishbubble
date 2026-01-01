import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

// GET /api/user/settings - Get user settings
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
        image: true,
        avatarUrl: true,
        emailVerified: true,
        passwordHash: true,
        notifyEmail: true,
        notifyInApp: true,
        notifyDigest: true,
        digestDay: true,
        emailOnMemberJoined: true,
        emailOnSecretSantaDraw: true,
        emailOnEventReminder: true,
        emailOnWishlistReminder: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Return emailVerified as boolean and hasPassword instead of passwordHash
    const { passwordHash, emailVerified, ...rest } = user;
    return NextResponse.json({
      ...rest,
      emailVerified: !!emailVerified,
      hasPassword: !!passwordHash,
    });
  } catch (error) {
    logger.error("Error fetching user settings", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// PATCH /api/user/settings - Update user settings
export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      notifyEmail,
      notifyInApp,
      notifyDigest,
      digestDay,
      emailOnMemberJoined,
      emailOnSecretSantaDraw,
      emailOnEventReminder,
      emailOnWishlistReminder,
    } = body;

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name !== undefined && { name }),
        ...(notifyEmail !== undefined && { notifyEmail }),
        ...(notifyInApp !== undefined && { notifyInApp }),
        ...(notifyDigest !== undefined && { notifyDigest }),
        ...(digestDay !== undefined && { digestDay }),
        ...(emailOnMemberJoined !== undefined && { emailOnMemberJoined }),
        ...(emailOnSecretSantaDraw !== undefined && { emailOnSecretSantaDraw }),
        ...(emailOnEventReminder !== undefined && { emailOnEventReminder }),
        ...(emailOnWishlistReminder !== undefined && { emailOnWishlistReminder }),
      },
      select: {
        name: true,
        email: true,
        image: true,
        avatarUrl: true,
        notifyEmail: true,
        notifyInApp: true,
        notifyDigest: true,
        digestDay: true,
        emailOnMemberJoined: true,
        emailOnSecretSantaDraw: true,
        emailOnEventReminder: true,
        emailOnWishlistReminder: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    logger.error("Error updating user settings", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
