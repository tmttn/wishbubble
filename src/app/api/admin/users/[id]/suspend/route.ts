import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin";
import { logger } from "@/lib/logger";
import { sendAccountSuspendedEmail } from "@/lib/email";

const suspendSchema = z.object({
  reason: z.string().min(1, "Reason is required").max(500),
  durationDays: z.number().int().min(1).max(365).nullable(), // null = permanent
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/users/[id]/suspend
 * Suspend a user account
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const adminCheck = await requireAdminApi();
    if (adminCheck.error) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.status }
      );
    }
    const adminSession = adminCheck.session!;

    const { id } = await params;
    const body = await request.json();

    const validation = suspendSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { reason, durationDays } = validation.data;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, locale: true, isAdmin: true, suspendedAt: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent suspending admins
    if (user.isAdmin) {
      return NextResponse.json(
        { error: "Cannot suspend admin users" },
        { status: 400 }
      );
    }

    // Check if already suspended
    if (user.suspendedAt) {
      return NextResponse.json(
        { error: "User is already suspended" },
        { status: 400 }
      );
    }

    // Calculate suspension end date
    const suspendedUntil = durationDays
      ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
      : null;

    // Suspend the user
    await prisma.$transaction([
      prisma.user.update({
        where: { id },
        data: {
          suspendedAt: new Date(),
          suspendedUntil,
          suspensionReason: reason,
          suspendedBy: adminSession.user.id,
        },
      }),
      prisma.activity.create({
        data: {
          type: "USER_SUSPENDED",
          userId: id,
          metadata: {
            adminId: adminSession.user.id,
            adminEmail: adminSession.user.email,
            reason,
            durationDays,
            suspendedUntil: suspendedUntil?.toISOString() ?? null,
          },
        },
      }),
    ]);

    // Send notification email
    await sendAccountSuspendedEmail({
      to: user.email,
      reason,
      suspendedUntil,
      locale: user.locale || "en",
    });

    logger.info("User suspended", {
      userId: id,
      adminId: adminSession.user.id,
      durationDays,
    });

    return NextResponse.json({
      success: true,
      message: `User suspended${durationDays ? ` for ${durationDays} days` : " permanently"}`,
    });
  } catch (error) {
    logger.error("Error suspending user", error);
    return NextResponse.json(
      { error: "Failed to suspend user" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[id]/suspend
 * Unsuspend a user account
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
    const adminSession = adminCheck.session!;

    const { id } = await params;

    // Check if user exists and is suspended
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, suspendedAt: true, suspensionReason: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.suspendedAt) {
      return NextResponse.json(
        { error: "User is not suspended" },
        { status: 400 }
      );
    }

    // Unsuspend the user
    await prisma.$transaction([
      prisma.user.update({
        where: { id },
        data: {
          suspendedAt: null,
          suspendedUntil: null,
          suspensionReason: null,
          suspendedBy: null,
        },
      }),
      prisma.activity.create({
        data: {
          type: "USER_UNSUSPENDED",
          userId: id,
          metadata: {
            adminId: adminSession.user.id,
            adminEmail: adminSession.user.email,
            previousReason: user.suspensionReason,
          },
        },
      }),
    ]);

    logger.info("User unsuspended", {
      userId: id,
      adminId: adminSession.user.id,
    });

    return NextResponse.json({
      success: true,
      message: "User unsuspended successfully",
    });
  } catch (error) {
    logger.error("Error unsuspending user", error);
    return NextResponse.json(
      { error: "Failed to unsuspend user" },
      { status: 500 }
    );
  }
}
