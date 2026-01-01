import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin";
import { stripe } from "@/lib/stripe";
import { logger } from "@/lib/logger";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/coupons/[id] - Get coupon details
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const adminResult = await requireAdminApi();
    if (adminResult.error) {
      return NextResponse.json(
        { error: adminResult.error },
        { status: adminResult.status }
      );
    }

    const { id } = await params;

    const coupon = await prisma.coupon.findUnique({
      where: { id },
      include: {
        redemptions: {
          orderBy: { redeemedAt: "desc" },
          take: 50,
        },
        _count: {
          select: { redemptions: true },
        },
      },
    });

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    return NextResponse.json(coupon);
  } catch (error) {
    logger.error("Error fetching coupon", error);
    return NextResponse.json(
      { error: "Failed to fetch coupon" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/coupons/[id] - Update coupon (toggle active status)
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const adminResult = await requireAdminApi();
    if (adminResult.error) {
      return NextResponse.json(
        { error: adminResult.error },
        { status: adminResult.status }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { isActive, maxRedemptions, validUntil } = body;

    const coupon = await prisma.coupon.findUnique({
      where: { id },
    });

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    // Update coupon
    const updatedCoupon = await prisma.coupon.update({
      where: { id },
      data: {
        ...(isActive !== undefined && { isActive }),
        ...(maxRedemptions !== undefined && { maxRedemptions }),
        ...(validUntil !== undefined && {
          validUntil: validUntil ? new Date(validUntil) : null,
        }),
      },
    });

    // Sync status to Stripe if coupon exists there
    if (coupon.stripeCouponId && isActive !== undefined) {
      try {
        // Stripe coupons can't be updated, but we can delete and recreate
        // For simplicity, we just track the status in our DB
        console.log(`[Coupon] Status updated to ${isActive} (Stripe sync skipped)`);
      } catch (stripeError) {
        logger.error("Failed to update Stripe coupon", stripeError);
      }
    }

    return NextResponse.json(updatedCoupon);
  } catch (error) {
    logger.error("Error updating coupon", error);
    return NextResponse.json(
      { error: "Failed to update coupon" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/coupons/[id] - Delete coupon
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const adminResult = await requireAdminApi();
    if (adminResult.error) {
      return NextResponse.json(
        { error: adminResult.error },
        { status: adminResult.status }
      );
    }

    const { id } = await params;

    const coupon = await prisma.coupon.findUnique({
      where: { id },
    });

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    // Delete from Stripe first if it exists
    if (coupon.stripeCouponId) {
      try {
        await stripe.coupons.del(coupon.stripeCouponId);
      } catch (stripeError) {
        logger.error("Failed to delete Stripe coupon", stripeError);
        // Continue with DB deletion even if Stripe fails
      }
    }

    // Delete from database (cascades to redemptions)
    await prisma.coupon.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error deleting coupon", error);
    return NextResponse.json(
      { error: "Failed to delete coupon" },
      { status: 500 }
    );
  }
}
