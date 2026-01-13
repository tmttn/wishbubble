import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { queuePasswordResetEmail } from "@/lib/email/queue";
import { randomBytes } from "crypto";
import { z } from "zod";
import { checkRateLimit, getClientIp, rateLimiters } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(request: Request) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const userAgent = request.headers.get("user-agent") || undefined;
    const rateLimitResult = await checkRateLimit(ip, rateLimiters.forgotPassword, { userAgent });
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many password reset requests. Please try again later." },
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

    const validatedData = forgotPasswordSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const { email } = validatedData.data;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        locale: true,
      },
    });

    // Always return success to prevent email enumeration
    if (!user || !user.passwordHash) {
      // User doesn't exist or uses OAuth - still return success
      return NextResponse.json({
        message: "If an account exists with this email, you will receive a password reset link.",
      });
    }

    // Delete any existing tokens for this email
    await prisma.passwordResetToken.deleteMany({
      where: { email },
    });

    // Generate token
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store token
    await prisma.passwordResetToken.create({
      data: {
        email,
        token,
        expires,
      },
    });

    // Send email
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    await queuePasswordResetEmail({
      to: email,
      resetUrl,
      locale: user.locale || "en",
    });

    // Log activity
    await prisma.activity.create({
      data: {
        type: "PASSWORD_RESET_REQUESTED",
        userId: user.id,
        metadata: { email },
      },
    });

    return NextResponse.json({
      message: "If an account exists with this email, you will receive a password reset link.",
    });
  } catch (error) {
    logger.error("Forgot password error", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
