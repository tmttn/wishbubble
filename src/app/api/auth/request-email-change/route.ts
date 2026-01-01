import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendEmailChangeVerification } from "@/lib/email";
import { randomBytes } from "crypto";
import { z } from "zod";
import { compare } from "bcryptjs";
import { checkRateLimit, getClientIp, rateLimiters } from "@/lib/rate-limit";

const requestEmailChangeSchema = z.object({
  newEmail: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Rate limiting
    const ip = getClientIp(request);
    const userAgent = request.headers.get("user-agent") || undefined;
    const rateLimitResult = checkRateLimit(ip, rateLimiters.emailChange, { userAgent });
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many email change requests. Please try again later." },
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

    const validatedData = requestEmailChangeSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { error: validatedData.error.issues[0].message },
        { status: 400 }
      );
    }

    const { newEmail, password } = validatedData.data;

    // Get current user with password hash
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        locale: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user has a password (not OAuth-only)
    if (!user.passwordHash) {
      return NextResponse.json(
        { error: "Cannot change email for accounts without a password" },
        { status: 400 }
      );
    }

    // Verify password
    const isValidPassword = await compare(password, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Incorrect password" },
        { status: 400 }
      );
    }

    // Check if new email is the same as current
    if (newEmail.toLowerCase() === user.email.toLowerCase()) {
      return NextResponse.json(
        { error: "New email must be different from current email" },
        { status: 400 }
      );
    }

    // Check if new email is already in use
    const existingUser = await prisma.user.findUnique({
      where: { email: newEmail.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "This email is already in use" },
        { status: 400 }
      );
    }

    // Delete any existing email change tokens for this user
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: {
          startsWith: `email-change:${user.id}:`,
        },
      },
    });

    // Generate new token
    // Format: email-change:userId:newEmail
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const identifier = `email-change:${user.id}:${newEmail.toLowerCase()}`;

    // Store token
    await prisma.verificationToken.create({
      data: {
        identifier,
        token,
        expires,
      },
    });

    // Send verification email to the NEW email address
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const verificationUrl = `${baseUrl}/api/auth/verify-email-change?token=${token}`;

    await sendEmailChangeVerification({
      to: newEmail,
      verificationUrl,
      locale: user.locale || "en",
    });

    // Log activity
    await prisma.activity.create({
      data: {
        type: "EMAIL_CHANGE_REQUESTED",
        userId: user.id,
        metadata: {
          oldEmail: user.email,
          newEmail: newEmail.toLowerCase(),
        },
      },
    });

    return NextResponse.json({
      message: "Verification email sent to your new address",
    });
  } catch (error) {
    console.error("Request email change error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
