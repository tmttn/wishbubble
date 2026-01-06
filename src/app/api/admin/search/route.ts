import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin";

interface SearchResult {
  type: "user" | "bubble" | "wishlist" | "item" | "gift-guide";
  id: string;
  title: string;
  subtitle?: string;
  url: string;
  meta?: Record<string, string | number | boolean>;
}

/**
 * GET /api/admin/search?q=query
 * Global search across users, bubbles, wishlists, items, and gift guides
 */
export async function GET(request: Request) {
  try {
    const adminCheck = await requireAdminApi();
    if (adminCheck.error) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "5"), 10);
    const typesParam = searchParams.get("types");
    const types = typesParam ? typesParam.split(",") : null;

    if (query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const shouldSearch = (type: string) => !types || types.includes(type);

    // Search in parallel (only search types that are requested)
    const [users, bubbles, wishlists, items, giftGuides] = await Promise.all([
      // Users: search by name, email, or ID
      shouldSearch("user")
        ? prisma.user.findMany({
            where: {
              deletedAt: null,
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { email: { contains: query, mode: "insensitive" } },
                { id: query },
              ],
            },
            select: {
              id: true,
              name: true,
              email: true,
              subscriptionTier: true,
              isAdmin: true,
            },
            take: limit,
            orderBy: { createdAt: "desc" },
          })
        : Promise.resolve([]),

      // Bubbles: search by name
      shouldSearch("bubble")
        ? prisma.bubble.findMany({
            where: {
              name: { contains: query, mode: "insensitive" },
            },
            select: {
              id: true,
              name: true,
              occasionType: true,
              archivedAt: true,
              _count: { select: { members: true } },
            },
            take: limit,
            orderBy: { createdAt: "desc" },
          })
        : Promise.resolve([]),

      // Wishlists: search by name or user name/email
      shouldSearch("wishlist")
        ? prisma.wishlist.findMany({
            where: {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { user: { name: { contains: query, mode: "insensitive" } } },
                { user: { email: { contains: query, mode: "insensitive" } } },
              ],
            },
            select: {
              id: true,
              name: true,
              isDefault: true,
              user: { select: { name: true, email: true } },
              _count: { select: { items: true } },
            },
            take: limit,
            orderBy: { createdAt: "desc" },
          })
        : Promise.resolve([]),

      // Items: search by title or description
      shouldSearch("item")
        ? prisma.wishlistItem.findMany({
            where: {
              OR: [
                { title: { contains: query, mode: "insensitive" } },
                { description: { contains: query, mode: "insensitive" } },
              ],
            },
            select: {
              id: true,
              title: true,
              price: true,
              currency: true,
              wishlist: {
                select: {
                  name: true,
                  user: { select: { name: true } },
                },
              },
            },
            take: limit,
            orderBy: { createdAt: "desc" },
          })
        : Promise.resolve([]),

      // Gift Guides: search by title (titleEn)
      shouldSearch("gift-guide")
        ? prisma.giftGuide.findMany({
            where: {
              OR: [
                { titleEn: { contains: query, mode: "insensitive" } },
                { titleNl: { contains: query, mode: "insensitive" } },
              ],
            },
            select: {
              id: true,
              titleEn: true,
              slug: true,
              isPublished: true,
            },
            take: limit,
            orderBy: { createdAt: "desc" },
          })
        : Promise.resolve([]),
    ]);

    // Transform results
    const results: SearchResult[] = [];

    // Add users
    for (const user of users) {
      results.push({
        type: "user",
        id: user.id,
        title: user.name || "No name",
        subtitle: user.email,
        url: `/admin/users/${user.id}`,
        meta: {
          tier: user.subscriptionTier,
          isAdmin: user.isAdmin,
        },
      });
    }

    // Add bubbles
    for (const bubble of bubbles) {
      results.push({
        type: "bubble",
        id: bubble.id,
        title: bubble.name,
        subtitle: `${bubble.occasionType} · ${bubble._count.members} members`,
        url: `/admin/groups/${bubble.id}`,
        meta: {
          archived: !!bubble.archivedAt,
        },
      });
    }

    // Add wishlists
    for (const wishlist of wishlists) {
      results.push({
        type: "wishlist",
        id: wishlist.id,
        title: wishlist.name,
        subtitle: `${wishlist.user.name || wishlist.user.email} · ${wishlist._count.items} items`,
        url: `/admin/wishlists/${wishlist.id}`,
        meta: {
          isDefault: wishlist.isDefault,
        },
      });
    }

    // Add items
    for (const item of items) {
      const priceStr = item.price
        ? `${item.currency} ${Number(item.price).toFixed(2)}`
        : "";
      results.push({
        type: "item",
        id: item.id,
        title: item.title,
        subtitle: `${item.wishlist.user.name || "Unknown"}'s wishlist${priceStr ? ` · ${priceStr}` : ""}`,
        url: `/admin/items/${item.id}`,
      });
    }

    // Add gift guides
    for (const guide of giftGuides) {
      results.push({
        type: "gift-guide",
        id: guide.id,
        title: guide.titleEn,
        subtitle: guide.isPublished ? "Published" : "Draft",
        url: `/admin/gift-guides/${guide.slug}`,
        meta: {
          published: guide.isPublished,
        },
      });
    }

    return NextResponse.json({
      results,
      counts: {
        users: users.length,
        bubbles: bubbles.length,
        wishlists: wishlists.length,
        items: items.length,
        giftGuides: giftGuides.length,
      },
    });
  } catch (error) {
    console.error("Error in admin search:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
