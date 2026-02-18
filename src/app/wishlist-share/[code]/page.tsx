import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PublicWishlistView } from "@/components/share/public-wishlist-view";

interface PageProps {
  params: Promise<{ code: string }>;
}

async function getWishlistByShareCode(code: string) {
  const wishlist = await prisma.wishlist.findUnique({
    where: { shareCode: code },
    select: {
      id: true,
      name: true,
      description: true,
      shareEnabled: true,
      user: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          image: true,
        },
      },
      items: {
        where: { deletedAt: null },
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          price: true,
          priceMax: true,
          currency: true,
          url: true,
          imageUrl: true,
          uploadedImage: true,
          priority: true,
          quantity: true,
          category: true,
        },
      },
    },
  });

  return wishlist;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;
  const wishlist = await getWishlistByShareCode(code);

  if (!wishlist || !wishlist.shareEnabled) {
    return {
      title: "Wishlist Not Found | WishBubble",
    };
  }

  const totalItems = wishlist.items.length;

  return {
    title: `${wishlist.name} - ${wishlist.user.name}'s Wishlist | WishBubble`,
    description:
      wishlist.description ||
      `Check out ${wishlist.user.name}'s wishlist with ${totalItems} items on WishBubble`,
    openGraph: {
      title: `${wishlist.name} | WishBubble`,
      description:
        wishlist.description ||
        `${wishlist.user.name}'s wishlist with ${totalItems} items`,
      type: "website",
    },
  };
}

export default async function PublicWishlistPage({ params }: PageProps) {
  const { code } = await params;
  const wishlist = await getWishlistByShareCode(code);

  if (!wishlist || !wishlist.shareEnabled) {
    notFound();
  }

  const items = wishlist.items.map((item) => ({
    ...item,
    price: item.price ? Number(item.price) : null,
    priceMax: item.priceMax ? Number(item.priceMax) : null,
  }));

  return (
    <PublicWishlistView
      wishlist={{
        id: wishlist.id,
        name: wishlist.name,
        description: wishlist.description,
      }}
      owner={{
        name: wishlist.user.name,
        avatarUrl: wishlist.user.avatarUrl || wishlist.user.image,
      }}
      items={items}
      totalItems={items.length}
      shareCode={code}
    />
  );
}
