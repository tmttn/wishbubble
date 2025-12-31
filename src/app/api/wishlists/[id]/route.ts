import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateWishlistSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  isDefault: z.boolean().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/wishlists/[id] - Get a single wishlist with items
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const wishlist = await prisma.wishlist.findUnique({
      where: { id },
      include: {
        items: {
          where: { deletedAt: null },
          orderBy: { sortOrder: "asc" },
        },
        bubbles: {
          where: { isVisible: true },
          include: {
            bubble: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
    });

    if (!wishlist) {
      return NextResponse.json({ error: "Wishlist not found" }, { status: 404 });
    }

    if (wishlist.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
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

// PATCH /api/wishlists/[id] - Update a wishlist (rename or set as default)
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateWishlistSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validatedData.error.issues },
        { status: 400 }
      );
    }

    // Verify ownership
    const wishlist = await prisma.wishlist.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!wishlist) {
      return NextResponse.json({ error: "Wishlist not found" }, { status: 404 });
    }

    if (wishlist.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { name, isDefault } = validatedData.data;

    // If setting as default, unset other defaults first
    if (isDefault === true) {
      await prisma.wishlist.updateMany({
        where: { userId: session.user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.wishlist.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(isDefault !== undefined && { isDefault }),
      },
      include: {
        _count: {
          select: {
            items: { where: { deletedAt: null } },
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating wishlist:", error);
    return NextResponse.json(
      { error: "Failed to update wishlist" },
      { status: 500 }
    );
  }
}

// DELETE /api/wishlists/[id] - Delete a wishlist
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership and check if default
    const wishlist = await prisma.wishlist.findUnique({
      where: { id },
      select: { userId: true, isDefault: true },
    });

    if (!wishlist) {
      return NextResponse.json({ error: "Wishlist not found" }, { status: 404 });
    }

    if (wishlist.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (wishlist.isDefault) {
      return NextResponse.json(
        { error: "Cannot delete default wishlist" },
        { status: 400 }
      );
    }

    // Delete wishlist and cascade items/attachments
    await prisma.$transaction([
      // Remove bubble attachments
      prisma.bubbleWishlist.deleteMany({
        where: { wishlistId: id },
      }),
      // Delete items (hard delete since we're deleting the whole wishlist)
      prisma.wishlistItem.deleteMany({
        where: { wishlistId: id },
      }),
      // Delete the wishlist
      prisma.wishlist.delete({
        where: { id },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting wishlist:", error);
    return NextResponse.json(
      { error: "Failed to delete wishlist" },
      { status: 500 }
    );
  }
}
