import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createWishlistItemSchema } from "@/lib/validators/wishlist";

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
    console.error("Error fetching wishlist:", error);
    return NextResponse.json(
      { error: "Failed to fetch wishlist" },
      { status: 500 }
    );
  }
}

// POST /api/wishlist - Add item to default wishlist
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

    // Get or create default wishlist
    let wishlist = await prisma.wishlist.findFirst({
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
    console.error("Error creating wishlist item:", error);
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
    console.error("Error deleting wishlist item:", error);
    return NextResponse.json(
      { error: "Failed to delete item" },
      { status: 500 }
    );
  }
}
