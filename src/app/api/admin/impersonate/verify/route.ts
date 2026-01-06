import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * POST /api/admin/impersonate/verify
 * Verifies an impersonation token and returns user data for session creation
 */
export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    // Find the token
    const impersonationToken = await prisma.impersonationToken.findUnique({
      where: { token },
      include: {
        targetUser: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            avatarUrl: true,
          },
        },
        adminUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!impersonationToken) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      );
    }

    // Check if already used
    if (impersonationToken.usedAt) {
      return NextResponse.json(
        { error: "Token has already been used" },
        { status: 400 }
      );
    }

    // Check if expired
    if (impersonationToken.expires < new Date()) {
      return NextResponse.json(
        { error: "Token has expired" },
        { status: 400 }
      );
    }

    // Mark token as used
    await prisma.impersonationToken.update({
      where: { id: impersonationToken.id },
      data: { usedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      targetUser: impersonationToken.targetUser,
      adminUser: impersonationToken.adminUser,
    });
  } catch (error) {
    console.error("Error verifying impersonation token:", error);
    return NextResponse.json(
      { error: "Failed to verify token" },
      { status: 500 }
    );
  }
}
