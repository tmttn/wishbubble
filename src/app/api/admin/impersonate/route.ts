import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin";
import { randomBytes } from "crypto";
import { z } from "zod";

const impersonateSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

/**
 * POST /api/admin/impersonate
 * Creates an impersonation token for viewing the app as another user
 */
export async function POST(request: Request) {
  try {
    const adminCheck = await requireAdminApi();
    if (adminCheck.error) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    const adminUser = adminCheck.session!.user;

    const body = await request.json();
    const validation = impersonateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { userId } = validation.data;

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: { id: true, name: true, email: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Don't allow impersonating yourself
    if (targetUser.id === adminUser.id) {
      return NextResponse.json(
        { error: "Cannot impersonate yourself" },
        { status: 400 }
      );
    }

    // Generate a short-lived token (5 minutes)
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 5 * 60 * 1000);

    // Create the token
    await prisma.impersonationToken.create({
      data: {
        token,
        targetUserId: userId,
        adminUserId: adminUser.id,
        expires,
      },
    });

    // Log the impersonation activity
    await prisma.activity.create({
      data: {
        type: "ADMIN_IMPERSONATION",
        userId: adminUser.id,
        metadata: {
          targetUserId: userId,
          targetUserEmail: targetUser.email,
          targetUserName: targetUser.name,
          adminEmail: adminUser.email,
        },
      },
    });

    // Build the impersonation URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const impersonateUrl = `${baseUrl}/impersonate?token=${token}`;

    return NextResponse.json({
      url: impersonateUrl,
      targetUser: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
      },
    });
  } catch (error) {
    console.error("Error creating impersonation token:", error);
    return NextResponse.json(
      { error: "Failed to create impersonation token" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/impersonate
 * Gets recent impersonation sessions for the current admin
 */
export async function GET() {
  try {
    const adminCheck = await requireAdminApi();
    if (adminCheck.error) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    const adminUser = adminCheck.session!.user;

    // Get recent impersonation tokens for this admin
    const recentImpersonations = await prisma.impersonationToken.findMany({
      where: {
        adminUserId: adminUser.id,
      },
      select: {
        id: true,
        createdAt: true,
        usedAt: true,
        targetUser: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
      distinct: ["targetUserId"],
    });

    // Transform for response
    const results = recentImpersonations.map((token) => ({
      id: token.targetUser.id,
      name: token.targetUser.name,
      email: token.targetUser.email,
      image: token.targetUser.image || token.targetUser.avatarUrl,
      lastImpersonated: token.createdAt.toISOString(),
      wasUsed: !!token.usedAt,
    }));

    return NextResponse.json({ recentUsers: results });
  } catch (error) {
    console.error("Error fetching recent impersonations:", error);
    return NextResponse.json(
      { error: "Failed to fetch recent impersonations" },
      { status: 500 }
    );
  }
}
