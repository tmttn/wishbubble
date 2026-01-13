import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canUsePublicWishlists } from "@/lib/plans";
import { logger } from "@/lib/logger";
import { nanoid } from "nanoid";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/wishlists/[id]/share - Get current share status
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check tier access
    const { allowed } = await canUsePublicWishlists(session.user.id);
    if (!allowed) {
      return NextResponse.json(
        { error: "Public wishlists require the Complete plan" },
        { status: 403 }
      );
    }

    const wishlist = await prisma.wishlist.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        shareCode: true,
        shareEnabled: true,
      },
    });

    if (!wishlist) {
      return NextResponse.json({ error: "Wishlist not found" }, { status: 404 });
    }

    // Only owner can manage sharing
    if (wishlist.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the wishlist owner can manage sharing" },
        { status: 403 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://wish-bubble.app";
    const shareUrl = wishlist.shareCode
      ? `${baseUrl}/wishlist-share/${wishlist.shareCode}`
      : null;

    return NextResponse.json({
      shareEnabled: wishlist.shareEnabled,
      shareCode: wishlist.shareCode,
      shareUrl,
    });
  } catch (error) {
    logger.error("Error getting wishlist share status", error);
    return NextResponse.json(
      { error: "Failed to get share status" },
      { status: 500 }
    );
  }
}

// POST /api/wishlists/[id]/share - Enable sharing and generate share code
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check tier access
    const { allowed } = await canUsePublicWishlists(session.user.id);
    if (!allowed) {
      return NextResponse.json(
        { error: "Public wishlists require the Complete plan" },
        { status: 403 }
      );
    }

    const wishlist = await prisma.wishlist.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        shareCode: true,
        shareEnabled: true,
      },
    });

    if (!wishlist) {
      return NextResponse.json({ error: "Wishlist not found" }, { status: 404 });
    }

    // Only owner can manage sharing
    if (wishlist.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the wishlist owner can manage sharing" },
        { status: 403 }
      );
    }

    // Generate new share code if not exists
    const shareCode = wishlist.shareCode || nanoid(12);

    await prisma.wishlist.update({
      where: { id },
      data: {
        shareCode,
        shareEnabled: true,
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://wish-bubble.app";

    return NextResponse.json({
      shareEnabled: true,
      shareCode,
      shareUrl: `${baseUrl}/wishlist-share/${shareCode}`,
    });
  } catch (error) {
    logger.error("Error enabling wishlist sharing", error);
    return NextResponse.json(
      { error: "Failed to enable sharing" },
      { status: 500 }
    );
  }
}

// DELETE /api/wishlists/[id]/share - Disable sharing
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const wishlist = await prisma.wishlist.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!wishlist) {
      return NextResponse.json({ error: "Wishlist not found" }, { status: 404 });
    }

    // Only owner can manage sharing
    if (wishlist.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the wishlist owner can manage sharing" },
        { status: 403 }
      );
    }

    await prisma.wishlist.update({
      where: { id },
      data: {
        shareEnabled: false,
        // Keep the shareCode so re-enabling gives the same URL
      },
    });

    return NextResponse.json({
      shareEnabled: false,
    });
  } catch (error) {
    logger.error("Error disabling wishlist sharing", error);
    return NextResponse.json(
      { error: "Failed to disable sharing" },
      { status: 500 }
    );
  }
}

// PATCH /api/wishlists/[id]/share - Regenerate share code
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check tier access
    const { allowed } = await canUsePublicWishlists(session.user.id);
    if (!allowed) {
      return NextResponse.json(
        { error: "Public wishlists require the Complete plan" },
        { status: 403 }
      );
    }

    const wishlist = await prisma.wishlist.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        shareEnabled: true,
      },
    });

    if (!wishlist) {
      return NextResponse.json({ error: "Wishlist not found" }, { status: 404 });
    }

    // Only owner can manage sharing
    if (wishlist.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Only the wishlist owner can manage sharing" },
        { status: 403 }
      );
    }

    const newShareCode = nanoid(12);

    await prisma.wishlist.update({
      where: { id },
      data: {
        shareCode: newShareCode,
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://wish-bubble.app";

    return NextResponse.json({
      shareEnabled: wishlist.shareEnabled,
      shareCode: newShareCode,
      shareUrl: `${baseUrl}/wishlist-share/${newShareCode}`,
    });
  } catch (error) {
    logger.error("Error regenerating wishlist share code", error);
    return NextResponse.json(
      { error: "Failed to regenerate share code" },
      { status: 500 }
    );
  }
}
