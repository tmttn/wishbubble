import { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicWishlistView } from "@/components/share/public-wishlist-view";

interface PageProps {
  params: Promise<{ code: string }>;
}

// Fetch the wishlist data from our API
async function getWishlist(code: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://wish-bubble.app";

  const res = await fetch(`${baseUrl}/api/wishlist-share/${code}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return null;
  }

  return res.json();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;
  const data = await getWishlist(code);

  if (!data) {
    return {
      title: "Wishlist Not Found | WishBubble",
    };
  }

  const { wishlist, owner, totalItems } = data;

  return {
    title: `${wishlist.name} - ${owner.name}'s Wishlist | WishBubble`,
    description:
      wishlist.description ||
      `Check out ${owner.name}'s wishlist with ${totalItems} items on WishBubble`,
    openGraph: {
      title: `${wishlist.name} | WishBubble`,
      description:
        wishlist.description ||
        `${owner.name}'s wishlist with ${totalItems} items`,
      type: "website",
    },
  };
}

export default async function PublicWishlistPage({ params }: PageProps) {
  const { code } = await params;
  const data = await getWishlist(code);

  if (!data) {
    notFound();
  }

  return (
    <PublicWishlistView
      wishlist={data.wishlist}
      owner={data.owner}
      items={data.items}
      totalItems={data.totalItems}
      shareCode={code}
    />
  );
}
