import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { registerSchema } from "@/lib/validators/auth";
import { sendVerificationEmail } from "@/lib/email";
import { randomBytes } from "crypto";
import { checkRateLimit, getClientIp, rateLimiters } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const userAgent = request.headers.get("user-agent") || undefined;
    const rateLimitResult = checkRateLimit(ip, rateLimiters.register, { userAgent });
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.resetAt.toString(),
          },
        }
      );
    }

    const body = await request.json();

    const validatedData = registerSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validatedData.error.issues },
        { status: 400 }
      );
    }

    const { name, email, password } = validatedData.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    // Create default wishlist
    await prisma.wishlist.create({
      data: {
        userId: user.id,
        name: "My Wishlist",
        isDefault: true,
      },
    });

    // Create verification token
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    });

    // Send verification email (fire and forget - don't block registration)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;

    // Get locale from Accept-Language header for new users
    const acceptLanguage = request.headers.get("accept-language") || "en";
    const locale = acceptLanguage.startsWith("nl") ? "nl" : "en";

    sendVerificationEmail({
      to: email,
      verificationUrl,
      locale,
    }).catch((err) => {
      logger.error("Failed to send verification email", err, { email, userId: user.id });
    });

    // Log activity
    await prisma.activity.create({
      data: {
        type: "USER_REGISTERED",
        userId: user.id,
        metadata: { email, name },
      },
    });

    return NextResponse.json(
      { message: "Account created successfully", user },
      { status: 201 }
    );
  } catch (error) {
    logger.error("Registration error", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
