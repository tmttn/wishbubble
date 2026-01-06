import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { compare } from "bcryptjs";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

// Rate limit config for bubble PIN verification
const bubblePinRateLimit = {
  name: "bubble-pin",
  limit: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
};

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/bubbles/[id]/verify-pin - Verify personal PIN for a bubble
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { pin } = await request.json();

    if (!pin || typeof pin !== "string") {
      return NextResponse.json({ error: "PIN is required" }, { status: 400 });
    }

    // Rate limiting: 5 attempts per 15 minutes per bubble/user
    const rateLimitKey = `${id}:${session.user.id}`;
    const rateLimitResult = await checkRateLimit(rateLimitKey, bubblePinRateLimit);

    if (!rateLimitResult.success) {
      const retryAfterSeconds = Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000);
      return NextResponse.json(
        {
          error: "Too many PIN attempts. Please try again later.",
          retryAfter: retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    // Get membership with PIN hash
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

    // Check if user has PIN protection
    if (!membership.pinHash) {
      return NextResponse.json({ error: "You do not have PIN protection for this bubble" }, { status: 400 });
    }

    // Verify PIN
    const isValid = await compare(pin, membership.pinHash);

    if (!isValid) {
      return NextResponse.json(
        {
          error: "Invalid PIN",
          attemptsRemaining: rateLimitResult.remaining,
        },
        { status: 401 }
      );
    }

    // PIN is valid - set a cookie to remember verification
    // Cookie expires in 30 minutes
    const cookieStore = await cookies();
    const cookieName = `bubble-pin-verified-${id}`;
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    cookieStore.set(cookieName, session.user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });

    return NextResponse.json({
      success: true,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    logger.error("Error verifying bubble PIN", error);
    return NextResponse.json(
      { error: "Failed to verify PIN" },
      { status: 500 }
    );
  }
}

// GET /api/bubbles/[id]/verify-pin - Check if PIN is verified
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get membership with PIN info
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

    // Check if user has PIN protection
    const hasPinProtection = !!membership.pinHash;

    if (!hasPinProtection) {
      return NextResponse.json({
        hasPinProtection: false,
        isVerified: true, // No PIN needed
      });
    }

    // Check if PIN is verified via cookie
    const cookieStore = await cookies();
    const cookieName = `bubble-pin-verified-${id}`;
    const verificationCookie = cookieStore.get(cookieName);

    const isVerified = verificationCookie?.value === session.user.id;

    return NextResponse.json({
      hasPinProtection: true,
      isVerified,
    });
  } catch (error) {
    logger.error("Error checking bubble PIN status", error);
    return NextResponse.json(
      { error: "Failed to check PIN status" },
      { status: 500 }
    );
  }
}
