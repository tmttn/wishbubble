import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canCreateWishlist, getUserTier, getPlanLimits } from "@/lib/plans";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { getDefaultWishlistName } from "@/lib/i18n-server";

const createWishlistSchema = z.object({
  name: z.string().min(1).max(100),
});

// GET /api/wishlists - Get all user's wishlists
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let wishlists = await prisma.wishlist.findMany({
      where: { userId: session.user.id },
      include: {
        _count: {
          select: {
            items: { where: { deletedAt: null } },
          },
        },
      },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    });

    // Auto-create a default wishlist if user has none
    if (wishlists.length === 0) {
      // Get user's locale for the default wishlist name
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { locale: true },
      });
      const defaultWishlistName = await getDefaultWishlistName(user?.locale);

      const defaultWishlist = await prisma.wishlist.create({
        data: {
          userId: session.user.id,
          name: defaultWishlistName,
          isDefault: true,
        },
        include: {
          _count: {
            select: {
              items: { where: { deletedAt: null } },
            },
          },
        },
      });
      wishlists = [defaultWishlist];
    }

    // Get user's limits
    const limitCheck = await canCreateWishlist(session.user.id);
    const tier = await getUserTier(session.user.id);
    const planLimits = getPlanLimits(tier);

    return NextResponse.json({
      wishlists,
      limits: {
        current: limitCheck.current,
        max: limitCheck.limit,
        canCreate: limitCheck.allowed,
        upgradeRequired: limitCheck.upgradeRequired,
      },
      itemLimits: {
        max: planLimits.maxItemsPerWishlist,
        isUnlimited: planLimits.maxItemsPerWishlist === -1,
      },
      tier,
    });
  } catch (error) {
    logger.error("Error fetching wishlists", error);
    return NextResponse.json(
      { error: "Failed to fetch wishlists" },
      { status: 500 }
    );
  }
}

// POST /api/wishlists - Create a new wishlist
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createWishlistSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validatedData.error.issues },
        { status: 400 }
      );
    }

    // Check limit
    const limitCheck = await canCreateWishlist(session.user.id);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: "Wishlist limit reached",
          upgradeRequired: limitCheck.upgradeRequired,
          current: limitCheck.current,
          limit: limitCheck.limit,
        },
        { status: 403 }
      );
    }

    // Check if user has any wishlists (to determine if this should be default)
    const existingCount = await prisma.wishlist.count({
      where: { userId: session.user.id },
    });

    const wishlist = await prisma.wishlist.create({
      data: {
        userId: session.user.id,
        name: validatedData.data.name,
        isDefault: existingCount === 0, // First wishlist is default
      },
      include: {
        _count: {
          select: {
            items: { where: { deletedAt: null } },
          },
        },
      },
    });

    return NextResponse.json(wishlist, { status: 201 });
  } catch (error) {
    logger.error("Error creating wishlist", error);
    return NextResponse.json(
      { error: "Failed to create wishlist" },
      { status: 500 }
    );
  }
}
