import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import { logger } from "@/lib/logger";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(
        new URL("/settings?emailChangeError=missing-token", request.url)
      );
    }

    // Find the verification token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.redirect(
        new URL("/settings?emailChangeError=invalid-token", request.url)
      );
    }

    // Check if it's an email change token
    if (!verificationToken.identifier.startsWith("email-change:")) {
      return NextResponse.redirect(
        new URL("/settings?emailChangeError=invalid-token", request.url)
      );
    }

    // Check if token is expired
    if (verificationToken.expires < new Date()) {
      // Delete expired token
      await prisma.verificationToken.delete({
        where: { token },
      });
      return NextResponse.redirect(
        new URL("/settings?emailChangeError=expired-token", request.url)
      );
    }

    // Parse the identifier: email-change:userId:newEmail
    const parts = verificationToken.identifier.split(":");
    if (parts.length !== 3) {
      return NextResponse.redirect(
        new URL("/settings?emailChangeError=invalid-token", request.url)
      );
    }

    const [, userId, newEmail] = parts;

    // Find the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        stripeCustomerId: true,
      },
    });

    if (!user) {
      return NextResponse.redirect(
        new URL("/settings?emailChangeError=user-not-found", request.url)
      );
    }

    // Check if new email is still available (could have been taken since request)
    const existingUser = await prisma.user.findUnique({
      where: { email: newEmail },
    });

    if (existingUser) {
      // Delete the token since it can't be used
      await prisma.verificationToken.delete({
        where: { token },
      });
      return NextResponse.redirect(
        new URL("/settings?emailChangeError=email-taken", request.url)
      );
    }

    const oldEmail = user.email;

    // Update user's email and mark as verified
    await prisma.user.update({
      where: { id: userId },
      data: {
        email: newEmail,
        emailVerified: new Date(),
      },
    });

    // Update Stripe customer email if user has a Stripe account
    if (user.stripeCustomerId) {
      try {
        await stripe.customers.update(user.stripeCustomerId, {
          email: newEmail,
        });
      } catch (stripeError) {
        // Log but don't fail - the email change was successful
        logger.error("Failed to update Stripe customer email", stripeError);
      }
    }

    // Delete used token
    await prisma.verificationToken.delete({
      where: { token },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        type: "EMAIL_CHANGED",
        userId: user.id,
        metadata: {
          oldEmail,
          newEmail,
        },
      },
    });

    // Redirect to settings with success
    return NextResponse.redirect(
      new URL("/settings?emailChanged=true", request.url)
    );
  } catch (error) {
    logger.error("Email change verification error", error);
    return NextResponse.redirect(
      new URL("/settings?emailChangeError=server-error", request.url)
    );
  }
}
