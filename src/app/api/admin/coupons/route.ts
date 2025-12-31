import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin";
import { createStripeCoupon } from "@/lib/stripe";
import { z } from "zod";

const createCouponSchema = z.object({
  code: z
    .string()
    .min(3)
    .max(20)
    .transform((v) => v.toUpperCase().replace(/[^A-Z0-9]/g, "")),
  discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
  discountAmount: z.number().min(1),
  appliesToTiers: z.array(z.enum(["PREMIUM", "FAMILY"])).default(["PREMIUM"]),
  appliesToInterval: z.array(z.enum(["MONTHLY", "YEARLY"])).default(["MONTHLY", "YEARLY"]),
  duration: z.enum(["ONCE", "REPEATING", "FOREVER"]).default("ONCE"),
  durationMonths: z.number().min(1).max(24).optional(),
  maxRedemptions: z.number().min(1).optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  syncToStripe: z.boolean().default(true),
});

// GET /api/admin/coupons - List all coupons
export async function GET() {
  try {
    const adminResult = await requireAdminApi();
    if (adminResult.error) {
      return NextResponse.json(
        { error: adminResult.error },
        { status: adminResult.status }
      );
    }

    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { redemptions: true },
        },
      },
    });

    return NextResponse.json(coupons);
  } catch (error) {
    console.error("Error fetching coupons:", error);
    return NextResponse.json(
      { error: "Failed to fetch coupons" },
      { status: 500 }
    );
  }
}

// POST /api/admin/coupons - Create a new coupon
export async function POST(request: Request) {
  try {
    const adminResult = await requireAdminApi();
    if (adminResult.error) {
      return NextResponse.json(
        { error: adminResult.error },
        { status: adminResult.status }
      );
    }

    const body = await request.json();
    const validation = createCouponSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if code already exists
    const existing = await prisma.coupon.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A coupon with this code already exists" },
        { status: 409 }
      );
    }

    // Validate discount amount
    if (data.discountType === "PERCENTAGE" && data.discountAmount > 100) {
      return NextResponse.json(
        { error: "Percentage discount cannot exceed 100%" },
        { status: 400 }
      );
    }

    // Create coupon in database
    const coupon = await prisma.coupon.create({
      data: {
        code: data.code,
        discountType: data.discountType,
        discountAmount: data.discountAmount,
        appliesToTiers: data.appliesToTiers,
        appliesToInterval: data.appliesToInterval,
        duration: data.duration,
        durationMonths: data.duration === "REPEATING" ? data.durationMonths : null,
        maxRedemptions: data.maxRedemptions,
        validFrom: data.validFrom ? new Date(data.validFrom) : new Date(),
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        isActive: true,
      },
    });

    // Sync to Stripe if requested
    if (data.syncToStripe) {
      try {
        await createStripeCoupon(coupon.id);
      } catch (stripeError) {
        console.error("Failed to sync coupon to Stripe:", stripeError);
        // Don't fail the request, but mark that Stripe sync failed
        await prisma.coupon.update({
          where: { id: coupon.id },
          data: { stripeCouponId: null },
        });
      }
    }

    // Fetch updated coupon with Stripe ID
    const updatedCoupon = await prisma.coupon.findUnique({
      where: { id: coupon.id },
    });

    return NextResponse.json(updatedCoupon, { status: 201 });
  } catch (error) {
    console.error("Error creating coupon:", error);
    return NextResponse.json(
      { error: "Failed to create coupon" },
      { status: 500 }
    );
  }
}
