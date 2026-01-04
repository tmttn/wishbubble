import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { PublicBubbleView } from "@/components/share/public-bubble-view";

interface PageProps {
  params: Promise<{ code: string }>;
}

async function getBubbleByShareCode(code: string) {
  const bubble = await prisma.bubble.findUnique({
    where: { shareCode: code },
    select: {
      id: true,
      name: true,
      description: true,
      occasionType: true,
      eventDate: true,
      archivedAt: true,
      shareEnabled: true,
      themeColor: true,
      coverImageUrl: true,
      inviteCode: true,
      owner: {
        select: { name: true },
      },
      _count: { select: { members: { where: { leftAt: null } } } },
      wishlists: {
        where: { isVisible: true },
        select: {
          wishlist: {
            select: {
              id: true,
              name: true,
              description: true,
              user: {
                select: { name: true },
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
          },
        },
      },
    },
  });

  return bubble;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params;
  const bubble = await getBubbleByShareCode(code);

  if (!bubble || !bubble.shareEnabled || bubble.archivedAt) {
    return {
      title: "Wishlist Not Found",
    };
  }

  const totalItems = bubble.wishlists.reduce(
    (acc, bw) => acc + bw.wishlist.items.length,
    0
  );

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://wish-bubble.app";

  return {
    title: `${bubble.name} - Wishlist on WishBubble`,
    description:
      bubble.description ||
      `View ${totalItems} gift ideas for ${bubble.name}. Join and participate in this wishlist group!`,
    openGraph: {
      title: bubble.name,
      description:
        bubble.description ||
        `${totalItems} gift ideas waiting to be discovered`,
      type: "website",
      url: `${baseUrl}/share/${code}`,
      images: bubble.coverImageUrl
        ? [{ url: bubble.coverImageUrl, alt: bubble.name }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: bubble.name,
      description:
        bubble.description ||
        `${totalItems} gift ideas waiting to be discovered`,
    },
  };
}

export default async function SharePage({ params }: PageProps) {
  const { code } = await params;
  const bubble = await getBubbleByShareCode(code);

  if (!bubble) {
    notFound();
  }

  if (!bubble.shareEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Sharing Disabled</h1>
          <p className="text-muted-foreground">
            The owner has disabled public sharing for this wishlist.
          </p>
        </div>
      </div>
    );
  }

  if (bubble.archivedAt) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Group Archived</h1>
          <p className="text-muted-foreground">
            This group has been archived and is no longer active.
          </p>
        </div>
      </div>
    );
  }

  // Transform data for component
  const wishlists = bubble.wishlists.map((bw) => ({
    id: bw.wishlist.id,
    name: bw.wishlist.name,
    description: bw.wishlist.description,
    ownerName: bw.wishlist.user.name,
    items: bw.wishlist.items.map((item) => ({
      ...item,
      price: item.price ? Number(item.price) : null,
      priceMax: item.priceMax ? Number(item.priceMax) : null,
    })),
  }));

  const totalItems = wishlists.reduce((acc, w) => acc + w.items.length, 0);

  // Use inviteCode for join link if available, otherwise use shareCode
  const joinCode = bubble.inviteCode || code;

  return (
    <PublicBubbleView
      bubble={{
        id: bubble.id,
        name: bubble.name,
        description: bubble.description,
        occasionType: bubble.occasionType,
        eventDate: bubble.eventDate?.toISOString() || null,
        memberCount: bubble._count.members,
        themeColor: bubble.themeColor,
        coverImageUrl: bubble.coverImageUrl,
      }}
      ownerName={bubble.owner.name}
      wishlists={wishlists}
      totalItems={totalItems}
      shareCode={joinCode}
    />
  );
}
