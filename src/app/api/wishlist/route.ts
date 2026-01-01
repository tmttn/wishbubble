import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createWishlistItemSchema, reorderItemsSchema, updateWishlistItemSchema } from "@/lib/validators/wishlist";
import { canAddItem } from "@/lib/plans";
import { logger } from "@/lib/logger";

// GET /api/wishlist - Get user's default wishlist with items
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let wishlist = await prisma.wishlist.findFirst({
      where: {
        userId: session.user.id,
        isDefault: true,
      },
      include: {
        items: {
          where: { deletedAt: null },
          orderBy: { sortOrder: "asc" },
        },
        bubbles: {
          include: {
            bubble: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
    });

    // Create default wishlist if it doesn't exist
    if (!wishlist) {
      wishlist = await prisma.wishlist.create({
        data: {
          userId: session.user.id,
          name: "My Wishlist",
          isDefault: true,
        },
        include: {
          items: {
            where: { deletedAt: null },
            orderBy: { sortOrder: "asc" },
          },
          bubbles: {
            include: {
              bubble: {
                select: { id: true, name: true, slug: true },
              },
            },
          },
        },
      });
    }

    return NextResponse.json(wishlist);
  } catch (error) {
    logger.error("Error fetching wishlist", error);
    return NextResponse.json(
      { error: "Failed to fetch wishlist" },
      { status: 500 }
    );
  }
}

// POST /api/wishlist - Add item to wishlist (default or specified)
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createWishlistItemSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validatedData.error.issues },
        { status: 400 }
      );
    }

    // Get wishlist (specific or default)
    const wishlistId = validatedData.data.wishlistId;
    let wishlist;

    if (wishlistId) {
      // Use specific wishlist
      wishlist = await prisma.wishlist.findUnique({
        where: { id: wishlistId },
      });

      if (!wishlist || wishlist.userId !== session.user.id) {
        return NextResponse.json({ error: "Wishlist not found" }, { status: 404 });
      }
    } else {
      // Get or create default wishlist
      wishlist = await prisma.wishlist.findFirst({
        where: {
          userId: session.user.id,
          isDefault: true,
        },
      });

      if (!wishlist) {
        wishlist = await prisma.wishlist.create({
          data: {
            userId: session.user.id,
            name: "My Wishlist",
            isDefault: true,
          },
        });
      }
    }

    // Check item limit
    const limitCheck = await canAddItem(session.user.id, wishlist.id);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        {
          error: "Item limit reached for this wishlist",
          upgradeRequired: limitCheck.upgradeRequired,
          current: limitCheck.current,
          limit: limitCheck.limit,
        },
        { status: 403 }
      );
    }

    // Get max sort order
    const maxSortOrder = await prisma.wishlistItem.aggregate({
      where: { wishlistId: wishlist.id },
      _max: { sortOrder: true },
    });

    const {
      title,
      description,
      price,
      priceMax,
      currency,
      url,
      imageUrl,
      priority,
      quantity,
      category,
      notes,
    } = validatedData.data;

    const item = await prisma.wishlistItem.create({
      data: {
        wishlistId: wishlist.id,
        title,
        description,
        price,
        priceMax,
        currency,
        url: url || null,
        imageUrl: imageUrl || null,
        priority,
        quantity,
        category,
        notes,
        sortOrder: (maxSortOrder._max.sortOrder || 0) + 1,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    logger.error("Error creating wishlist item", error);
    return NextResponse.json(
      { error: "Failed to create item" },
      { status: 500 }
    );
  }
}

// DELETE /api/wishlist?itemId=xxx - Soft delete a wishlist item
export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const item = await prisma.wishlistItem.findUnique({
      where: { id: itemId },
      include: {
        wishlist: {
          select: { userId: true },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (item.wishlist.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Soft delete
    await prisma.wishlistItem.update({
      where: { id: itemId },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error deleting wishlist item", error);
    return NextResponse.json(
      { error: "Failed to delete item" },
      { status: 500 }
    );
  }
}

// PUT /api/wishlist - Update a wishlist item
export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return NextResponse.json(
        { error: "Item ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = updateWishlistItemSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validatedData.error.issues },
        { status: 400 }
      );
    }

    // Verify ownership
    const item = await prisma.wishlistItem.findUnique({
      where: { id: itemId },
      include: {
        wishlist: {
          select: { userId: true },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (item.wishlist.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const {
      title,
      description,
      price,
      priceMax,
      currency,
      url,
      imageUrl,
      priority,
      quantity,
      category,
      notes,
    } = validatedData.data;

    const updatedItem = await prisma.wishlistItem.update({
      where: { id: itemId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price }),
        ...(priceMax !== undefined && { priceMax }),
        ...(currency !== undefined && { currency }),
        ...(url !== undefined && { url: url || null }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl || null }),
        ...(priority !== undefined && { priority }),
        ...(quantity !== undefined && { quantity }),
        ...(category !== undefined && { category }),
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json(updatedItem);
  } catch (error) {
    logger.error("Error updating wishlist item", error);
    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 }
    );
  }
}

// PATCH /api/wishlist - Reorder wishlist items
export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = reorderItemsSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validatedData.error.issues },
        { status: 400 }
      );
    }

    // Get user's default wishlist
    const wishlist = await prisma.wishlist.findFirst({
      where: {
        userId: session.user.id,
        isDefault: true,
      },
    });

    if (!wishlist) {
      return NextResponse.json({ error: "Wishlist not found" }, { status: 404 });
    }

    // Verify all items belong to the user's wishlist
    const itemIds = validatedData.data.items.map((item) => item.id);
    const items = await prisma.wishlistItem.findMany({
      where: {
        id: { in: itemIds },
        wishlistId: wishlist.id,
      },
    });

    if (items.length !== itemIds.length) {
      return NextResponse.json(
        { error: "Some items not found or don't belong to your wishlist" },
        { status: 400 }
      );
    }

    // Update sort orders in a transaction
    await prisma.$transaction(
      validatedData.data.items.map((item) =>
        prisma.wishlistItem.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error reordering wishlist items", error);
    return NextResponse.json(
      { error: "Failed to reorder items" },
      { status: 500 }
    );
  }
}
