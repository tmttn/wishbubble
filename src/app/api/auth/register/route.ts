import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { registerWithGuestWishlistSchema } from "@/lib/validators/auth";
import { queueVerificationEmail } from "@/lib/email/queue";
import { randomBytes } from "crypto";
import { checkRateLimit, getClientIp, rateLimiters } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { getDefaultWishlistName, getLocaleFromHeader, normalizeLocale } from "@/lib/i18n-server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const userAgent = request.headers.get("user-agent") || undefined;
    const rateLimitResult = await checkRateLimit(ip, rateLimiters.register, { userAgent });
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

    const validatedData = registerWithGuestWishlistSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validatedData.error.issues },
        { status: 400 }
      );
    }

    const { name, email, password, guestWishlistItems } = validatedData.data;

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

    // Get locale from cookie first, then Accept-Language header for new users
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get("locale")?.value;
    const acceptLanguage = request.headers.get("accept-language");
    // Use cookie locale if set, otherwise fall back to Accept-Language header
    const locale = cookieLocale
      ? normalizeLocale(cookieLocale)
      : getLocaleFromHeader(acceptLanguage);

    // Create default wishlist with localized name
    const defaultWishlistName = await getDefaultWishlistName(locale);
    const defaultWishlist = await prisma.wishlist.create({
      data: {
        userId: user.id,
        name: defaultWishlistName,
        isDefault: true,
      },
    });

    // Transfer guest wishlist items if provided
    if (guestWishlistItems && guestWishlistItems.length > 0) {
      await prisma.wishlistItem.createMany({
        data: guestWishlistItems.map((item, index) => ({
          wishlistId: defaultWishlist.id,
          title: item.title,
          description: item.description,
          price: item.price,
          priceMax: item.priceMax,
          currency: item.currency,
          url: item.url,
          imageUrl: item.imageUrl,
          priority: item.priority,
          quantity: item.quantity,
          notes: item.notes,
          sortOrder: index,
        })),
      });

      logger.info("Guest wishlist transferred during registration", {
        userId: user.id,
        itemCount: guestWishlistItems.length,
      });
    }

    // Store locale preference for the user
    await prisma.user.update({
      where: { id: user.id },
      data: { locale },
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

    queueVerificationEmail({
      to: email,
      verificationUrl,
      locale,
    }).catch((err) => {
      logger.error("Failed to queue verification email", err, { email, userId: user.id });
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
