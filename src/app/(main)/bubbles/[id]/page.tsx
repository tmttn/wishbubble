import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
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
  Users,
  Gift,
  Settings,
  UserPlus,
  Shuffle,
  Crown,
} from "lucide-react";
import { WishlistCard } from "@/components/bubbles/wishlist-card";
import { MemberActionsMenu } from "@/components/bubbles/member-actions-menu";
import { EventCountdown } from "@/components/bubbles/event-countdown";
import { PostEventTrigger } from "@/components/bubbles/post-event-trigger";
import { AttachWishlistButton } from "@/components/bubbles/attach-wishlist-button";

interface BubblePageProps {
  params: Promise<{ id: string }>;
}

export default async function BubblePage({ params }: BubblePageProps) {
  const { id } = await params;
  const session = await auth();
  const t = await getTranslations("bubbles");
  const tOccasions = await getTranslations("bubbles.occasions");
  const locale = await getLocale();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const bubble = await prisma.bubble.findUnique({
    where: { id },
    include: {
      owner: {
        select: { id: true, name: true, email: true, avatarUrl: true, image: true },
      },
      members: {
        where: { leftAt: null },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true, image: true },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
      wishlists: {
        include: {
          wishlist: {
            include: {
              user: {
                select: { id: true, name: true, avatarUrl: true, image: true },
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
    return new Intl.DateTimeFormat(locale, {
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
  const isEventPassed = bubble.eventDate ? new Date(bubble.eventDate) < new Date() : false;

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
            {t("detail.backToBubbles")}
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
                  {t("detail.invite")}
                </Link>
              </Button>
              {bubble.isSecretSanta && !bubble.secretSantaDrawn && (
                <Button variant="outline" asChild>
                  <Link href={`/bubbles/${bubble.id}/secret-santa`}>
                    <Shuffle className="mr-2 h-4 w-4" />
                    {t("detail.drawNames")}
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
      {bubble.eventDate && (
        <EventCountdown
          eventDate={bubble.eventDate}
          eventName={bubble.name}
          isEventPassed={isEventPassed}
        />
      )}

      {/* Post-event gift summary trigger */}
      {bubble.eventDate && (
        <PostEventTrigger
          bubbleId={bubble.id}
          bubbleName={bubble.name}
          eventDate={bubble.eventDate}
          isEventPassed={isEventPassed}
          currentUserId={session.user.id}
        />
      )}

      {/* Secret Santa Assignment */}
      {bubble.isSecretSanta && bubble.secretSantaDrawn && myAssignment && (
        <Card className="mb-6 bg-gradient-to-r from-red-500/10 to-green-500/10 border-none">
          <CardContent className="py-6">
            <div className="flex items-center gap-4">
              <Gift className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("detail.buyingGiftFor")}
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
                <span>{t("detail.shareWishlist")}</span>
              </div>
              <AttachWishlistButton
                bubbleId={bubble.id}
                label={t("detail.attachWishlist")}
                successMessage={t("detail.wishlistAttached")}
                errorMessage={t("detail.attachWishlistError")}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="wishlists" className="space-y-6">
        <TabsList>
          <TabsTrigger value="wishlists">
            <Gift className="mr-2 h-4 w-4" />
            {t("detail.tabs.wishlists", { count: bubble.wishlists.length })}
          </TabsTrigger>
          <TabsTrigger value="members">
            <Users className="mr-2 h-4 w-4" />
            {t("detail.tabs.members", { count: bubble.members.length })}
          </TabsTrigger>
        </TabsList>

        {/* Wishlists Tab */}
        <TabsContent value="wishlists" className="space-y-6">
          {bubble.wishlists.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t("detail.noWishlists.title")}</h3>
                <p className="text-muted-foreground">
                  {t("detail.noWishlists.description")}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {bubble.members.map((member, index) => {
              const gradients = [
                "from-violet-500 to-purple-500",
                "from-blue-500 to-cyan-500",
                "from-emerald-500 to-teal-500",
                "from-orange-500 to-amber-500",
                "from-pink-500 to-rose-500",
                "from-indigo-500 to-blue-500",
              ];
              const gradient = gradients[index % gradients.length];

              return (
                <Card key={member.id} className="overflow-hidden card-hover group relative">
                  <div className={`h-1 bg-gradient-to-r ${gradient}`} />
                  <MemberActionsMenu
                    member={{
                      id: member.id,
                      userId: member.userId,
                      role: member.role,
                      user: {
                        id: member.user.id,
                        name: member.user.name,
                        email: member.user.email,
                      },
                    }}
                    bubbleId={bubble.id}
                    bubbleName={bubble.name}
                    currentUserId={session.user.id}
                    currentUserRole={currentMember?.role || "MEMBER"}
                    ownerId={bubble.ownerId}
                  />
                  <CardContent className="pt-4 pb-4">
                    <div className="flex flex-col items-center text-center">
                      <div className={`relative p-0.5 rounded-full bg-gradient-to-br ${gradient} mb-3`}>
                        <Avatar className="h-16 w-16 border-2 border-background">
                          <AvatarImage src={member.user.avatarUrl || member.user.image || undefined} />
                          <AvatarFallback className={`bg-gradient-to-br ${gradient} text-white font-semibold text-lg`}>
                            {getInitials(member.user.name)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <p className="font-semibold">{member.user.name}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-full">
                        {member.user.email}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2">
                        {member.userId === bubble.ownerId && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 gap-1 bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
                            <Crown className="h-2.5 w-2.5" />
                            {t("card.owner")}
                          </Badge>
                        )}
                        {member.role === "ADMIN" &&
                          member.userId !== bubble.ownerId && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">Admin</Badge>
                          )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
