import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

const transferSchema = z.object({
  items: z.array(
    z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      price: z.number().optional(),
      priceMax: z.number().optional(),
      currency: z.string().default("EUR"),
      url: z.string().optional(),
      imageUrl: z.string().optional(),
      priority: z.enum(["MUST_HAVE", "NICE_TO_HAVE", "DREAM"]).default("NICE_TO_HAVE"),
      quantity: z.number().int().min(1).default(1),
      notes: z.string().optional(),
    })
  ),
});

// POST /api/guest/wishlist - Transfer guest wishlist to authenticated user
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = transferSchema.parse(body);

    if (validatedData.items.length === 0) {
      return NextResponse.json(
        { error: "No items to transfer" },
        { status: 400 }
      );
    }

    // Get or create default wishlist for user
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

    // Get current max sort order
    const maxSortOrder = await prisma.wishlistItem.aggregate({
      where: { wishlistId: wishlist.id },
      _max: { sortOrder: true },
    });

    let sortOrder = (maxSortOrder._max.sortOrder || 0) + 1;

    // Create items
    const createdItems = await prisma.wishlistItem.createMany({
      data: validatedData.items.map((item) => ({
        wishlistId: wishlist!.id,
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
        sortOrder: sortOrder++,
      })),
    });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: session.user.id,
        type: "WISHLIST_CREATED",
        metadata: {
          action: "guest_wishlist_transferred",
          itemCount: validatedData.items.length,
        },
      },
    });

    logger.info("Guest wishlist transferred", {
      userId: session.user.id,
      itemCount: validatedData.items.length,
    });

    return NextResponse.json({
      success: true,
      wishlistId: wishlist.id,
      itemsTransferred: createdItems.count,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    logger.error("Error transferring guest wishlist", error);
    return NextResponse.json(
      { error: "Failed to transfer wishlist" },
      { status: 500 }
    );
  }
}
