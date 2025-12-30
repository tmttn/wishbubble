import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Calendar,
  Users,
  Gift,
  Settings,
  UserPlus,
  Shuffle,
  Crown,
} from "lucide-react";
import { WishlistCard } from "@/components/bubbles/wishlist-card";

interface BubblePageProps {
  params: Promise<{ id: string }>;
}

export default async function BubblePage({ params }: BubblePageProps) {
  const { id } = await params;
  const session = await auth();
  const t = await getTranslations("bubbles");
  const tOccasions = await getTranslations("bubbles.occasions");

  if (!session?.user?.id) {
    redirect("/login");
  }

  const bubble = await prisma.bubble.findUnique({
    where: { id },
    include: {
      owner: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      members: {
        where: { leftAt: null },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
      wishlists: {
        include: {
          wishlist: {
            include: {
              user: {
                select: { id: true, name: true, avatarUrl: true },
              },
              items: {
                where: { deletedAt: null },
                orderBy: { sortOrder: "asc" },
              },
            },
          },
        },
      },
      secretSantaDraws: {
        where: { giverId: session.user.id },
        include: {
          receiver: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
      },
    },
  });

  if (!bubble) {
    notFound();
  }

  // Check if user is a member
  const isMember = bubble.members.some((m) => m.userId === session.user.id);
  if (!isMember) {
    redirect("/bubbles");
  }

  const isOwner = bubble.ownerId === session.user.id;
  const currentMember = bubble.members.find((m) => m.userId === session.user.id);
  const isAdmin = currentMember?.role === "ADMIN" || isOwner;

  // Get claims for this bubble (excluding current user's own items)
  const claims = await prisma.claim.findMany({
    where: {
      bubbleId: bubble.id,
      status: { in: ["CLAIMED", "PURCHASED"] },
    },
    include: {
      user: {
        select: { id: true, name: true, avatarUrl: true },
      },
      item: {
        select: { id: true, wishlistId: true },
      },
    },
  });

  // Check if user has attached their wishlist
  const userWishlist = await prisma.wishlist.findFirst({
    where: {
      userId: session.user.id,
      isDefault: true,
    },
  });

  const hasAttachedWishlist = bubble.wishlists.some(
    (bw) => bw.wishlist.userId === session.user.id
  );

  // Secret Santa assignment for current user
  const myAssignment = bubble.secretSantaDraws[0];

  const formatDate = (date: Date | null) => {
    if (!date) return null;
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const getDaysUntil = (date: Date | null) => {
    if (!date) return null;
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const daysUntil = getDaysUntil(bubble.eventDate);

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/bubbles">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Bubbles
          </Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{bubble.name}</h1>
            {bubble.isSecretSanta && (
              <Badge variant="secondary">
                <Shuffle className="mr-1 h-3 w-3" />
                Secret Santa
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            {tOccasions(bubble.occasionType)}
            {bubble.eventDate && ` • ${formatDate(bubble.eventDate)}`}
          </p>
          {bubble.description && (
            <p className="mt-2 text-muted-foreground">{bubble.description}</p>
          )}
        </div>

        <div className="flex gap-2">
          {isAdmin && (
            <>
              <Button variant="outline" asChild>
                <Link href={`/bubbles/${bubble.id}/invite`}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite
                </Link>
              </Button>
              {bubble.isSecretSanta && !bubble.secretSantaDrawn && (
                <Button variant="outline" asChild>
                  <Link href={`/bubbles/${bubble.id}/secret-santa`}>
                    <Shuffle className="mr-2 h-4 w-4" />
                    Draw Names
                  </Link>
                </Button>
              )}
              <Button variant="outline" size="icon" asChild>
                <Link href={`/bubbles/${bubble.id}/settings`}>
                  <Settings className="h-4 w-4" />
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Event countdown */}
      {daysUntil !== null && daysUntil > 0 && (
        <Card className="mb-6 bg-primary/5 border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <span className="font-medium">
                {daysUntil === 1
                  ? "1 day until the event!"
                  : `${daysUntil} days until the event!`}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Secret Santa Assignment */}
      {bubble.isSecretSanta && bubble.secretSantaDrawn && myAssignment && (
        <Card className="mb-6 bg-gradient-to-r from-red-500/10 to-green-500/10 border-none">
          <CardContent className="py-6">
            <div className="flex items-center gap-4">
              <Gift className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">
                  You are buying a gift for:
                </p>
                <p className="text-xl font-bold">{myAssignment.receiver.name}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attach wishlist prompt */}
      {!hasAttachedWishlist && userWishlist && (
        <Card className="mb-6 border-dashed">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Gift className="h-5 w-5 text-muted-foreground" />
                <span>Share your wishlist with this bubble</span>
              </div>
              <Button size="sm" asChild>
                <Link href={`/bubbles/${bubble.id}/attach-wishlist`}>
                  Attach Wishlist
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="wishlists" className="space-y-6">
        <TabsList>
          <TabsTrigger value="wishlists">
            <Gift className="mr-2 h-4 w-4" />
            Wishlists ({bubble.wishlists.length})
          </TabsTrigger>
          <TabsTrigger value="members">
            <Users className="mr-2 h-4 w-4" />
            Members ({bubble.members.length})
          </TabsTrigger>
        </TabsList>

        {/* Wishlists Tab */}
        <TabsContent value="wishlists" className="space-y-6">
          {bubble.wishlists.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No wishlists yet</h3>
                <p className="text-muted-foreground">
                  Members haven&apos;t attached their wishlists to this bubble yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {bubble.wishlists.map((bubbleWishlist) => {
                const wishlist = bubbleWishlist.wishlist;
                const isOwnWishlist = wishlist.userId === session.user.id;

                // Get claims for this wishlist's items (only if not own wishlist)
                const wishlistClaims = isOwnWishlist
                  ? []
                  : claims.filter((c) =>
                      wishlist.items.some((item) => item.id === c.item.id)
                    );

                return (
                  <WishlistCard
                    key={wishlist.id}
                    wishlist={wishlist}
                    claims={wishlistClaims}
                    isOwnWishlist={isOwnWishlist}
                    bubbleId={bubble.id}
                    currentUserId={session.user.id}
                  />
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Members</CardTitle>
              <CardDescription>
                {bubble.members.length} people in this bubble
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bubble.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={member.user.avatarUrl || undefined} />
                        <AvatarFallback>
                          {getInitials(member.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.user.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {member.user.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {member.userId === bubble.ownerId && (
                        <Badge variant="secondary">
                          <Crown className="mr-1 h-3 w-3" />
                          Owner
                        </Badge>
                      )}
                      {member.role === "ADMIN" &&
                        member.userId !== bubble.ownerId && (
                          <Badge variant="outline">Admin</Badge>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
