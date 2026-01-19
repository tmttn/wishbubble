import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canAddMember } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PremiumAvatar } from "@/components/ui/premium-avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Users,
  Gift,
  Settings,
  UserPlus,
  Shuffle,
  Crown,
  Clock,
  MessageSquare,
} from "lucide-react";
import { WishlistCard } from "@/components/bubbles/wishlist-card";
import { MemberActionsMenu } from "@/components/bubbles/member-actions-menu";
import { CancelInvitationButton } from "@/components/bubbles/cancel-invitation-button";
import { EventCountdown } from "@/components/bubbles/event-countdown";
import { PostEventTrigger } from "@/components/bubbles/post-event-trigger";
import { AttachWishlistButton } from "@/components/bubbles/attach-wishlist-button";
import { PinProtectedBubble } from "@/components/bubbles/pin-protected-bubble";
import { BubbleChat } from "@/components/bubbles/bubble-chat";
import { NotificationToggle } from "@/components/bubbles/notification-toggle";
import { ShareButton } from "@/components/bubbles/share-button";

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
    select: {
      id: true,
      name: true,
      description: true,
      occasionType: true,
      eventDate: true,
      ownerId: true,
      isSecretSanta: true,
      secretSantaDrawn: true,
      budgetMin: true,
      budgetMax: true,
      allowMemberWishlists: true,
      owner: {
        select: { id: true, name: true, email: true, avatarUrl: true, image: true },
      },
      members: {
        where: { leftAt: null },
        select: {
          userId: true,
          role: true,
          lastReadAt: true,
          notifyActivity: true,
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true, image: true, subscriptionTier: true },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
      wishlists: {
        where: { isVisible: true },
        select: {
          wishlistId: true,
          wishlist: {
            select: {
              id: true,
              name: true,
              userId: true,
              user: {
                select: { id: true, name: true, avatarUrl: true, image: true, subscriptionTier: true },
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
        select: {
          id: true,
          receiver: {
            select: { id: true, name: true, image: true, avatarUrl: true },
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

  // Get member limit info (based on owner's plan)
  const memberLimitInfo = await canAddMember(bubble.ownerId, id);
  const pendingInvitations = await prisma.invitation.findMany({
    where: {
      bubbleId: id,
      status: "PENDING",
      expiresAt: { gt: new Date() },
    },
    include: {
      inviter: {
        select: { name: true },
      },
    },
    orderBy: { sentAt: "desc" },
  });

  // pendingInvitations.length available for future use

  // Get claims for this bubble (excluding current user's own items)
  const claims = await prisma.claim.findMany({
    where: {
      bubbleId: bubble.id,
      status: { in: ["CLAIMED", "PURCHASED"] },
    },
    include: {
      user: {
        select: { id: true, name: true, image: true, avatarUrl: true },
      },
      item: {
        select: { id: true, wishlistId: true },
      },
    },
  });

  // Get all user's attached wishlist IDs
  const userAttachedWishlistIds = bubble.wishlists
    .filter((bw) => bw.wishlist.userId === session.user.id)
    .map((bw) => bw.wishlistId);

  // Check if user has any wishlists
  const userWishlistCount = await prisma.wishlist.count({
    where: { userId: session.user.id },
  });

  const hasAnyWishlist = userWishlistCount > 0;

  // Secret Santa assignment for current user
  const myAssignment = bubble.secretSantaDraws[0];

  // Get unread message count for current user
  const lastReadAt = currentMember?.lastReadAt;
  const unreadMessageCount = await prisma.bubbleMessage.count({
    where: {
      bubbleId: id,
      deletedAt: null,
      userId: { not: session.user.id }, // Don't count own messages
      createdAt: lastReadAt ? { gt: lastReadAt } : undefined,
    },
  });

  const formatDate = (date: Date | null) => {
    if (!date) return null;
    return new Intl.DateTimeFormat(locale, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const _getDaysUntil = (date: Date | null) => {
    if (!date) return null;
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };
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
    <PinProtectedBubble
      bubbleId={bubble.id}
      bubbleName={bubble.name}
      isSecretSanta={bubble.isSecretSanta}
    >
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
              <ShareButton bubbleId={bubble.id} />
              <Button variant="outline" size="icon" asChild>
                <Link href={`/bubbles/${bubble.id}/settings`}>
                  <Settings className="h-4 w-4" />
                </Link>
              </Button>
            </>
          )}
          <NotificationToggle
            bubbleId={bubble.id}
            initialNotifyActivity={currentMember?.notifyActivity ?? true}
            enabledTooltip={t("detail.notificationsEnabled")}
            disabledTooltip={t("detail.notificationsMuted")}
            enabledMessage={t("detail.notificationsEnabledMessage")}
            disabledMessage={t("detail.notificationsMutedMessage")}
          />
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

      {/* Attach wishlist prompt - only show if member wishlists are allowed OR user is admin/owner */}
      {hasAnyWishlist && (bubble.allowMemberWishlists || isAdmin) && (
        <Card className="mb-6 border-dashed">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Gift className="h-5 w-5 text-muted-foreground" />
                <span>
                  {userAttachedWishlistIds.length > 0
                    ? t("detail.shareAnotherWishlist")
                    : t("detail.shareWishlist")}
                </span>
              </div>
              <AttachWishlistButton
                bubbleId={bubble.id}
                label={
                  userAttachedWishlistIds.length > 0
                    ? t("detail.attachAnotherWishlist")
                    : t("detail.attachWishlist")
                }
                successMessage={t("detail.wishlistAttached")}
                createSuccessMessage={t("detail.wishlistCreatedAndAttached")}
                errorMessage={t("detail.attachWishlistError")}
                attachedWishlistIds={userAttachedWishlistIds}
                selectLabel={t("detail.selectWishlist")}
                alreadyAttachedLabel={t("detail.alreadyShared")}
                selectDescription={t("detail.selectWishlistDescription")}
                allAttachedMessage={t("detail.allWishlistsShared")}
                createNewLabel={t("detail.createNewList")}
                createNewPlaceholder={t("detail.createNewListPlaceholder")}
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
            {memberLimitInfo.limit === -1
              ? t("detail.tabs.members", { count: bubble.members.length })
              : t("detail.tabs.membersWithLimit", {
                  count: bubble.members.length,
                  limit: memberLimitInfo.limit,
                })}
          </TabsTrigger>
          <TabsTrigger value="chat" className="relative">
            <MessageSquare className="mr-2 h-4 w-4" />
            {t("detail.tabs.chat")}
            {unreadMessageCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
              </span>
            )}
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
              {(() => {
                // Group wishlists by user
                const wishlistsByUser = bubble.wishlists.reduce((acc, bw) => {
                  const userId = bw.wishlist.userId;
                  if (!acc[userId]) {
                    acc[userId] = [];
                  }
                  acc[userId].push(bw.wishlist);
                  return acc;
                }, {} as Record<string, typeof bubble.wishlists[0]["wishlist"][]>);

                return Object.entries(wishlistsByUser).map(([userId, wishlists]) => {
                  const isOwnWishlist = userId === session.user.id;

                  // Get all items from all wishlists for this user
                  const allItems = wishlists.flatMap((wl) => wl.items);

                  // Get claims for all items (only if not own wishlist)
                  const wishlistClaims = isOwnWishlist
                    ? []
                    : claims.filter((c) =>
                        allItems.some((item) => item.id === c.item.id)
                      );

                  return (
                    <WishlistCard
                      key={userId}
                      wishlists={wishlists}
                      claims={wishlistClaims}
                      isOwnWishlist={isOwnWishlist}
                      bubbleId={bubble.id}
                      currentUserId={session.user.id}
                      budgetMin={bubble.budgetMin ? Number(bubble.budgetMin) : null}
                      budgetMax={bubble.budgetMax ? Number(bubble.budgetMax) : null}
                    />
                  );
                });
              })()}
            </div>
          )}
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {bubble.members.map((member, index) => {
              const gradients = [
                "from-primary to-primary/70",
                "from-primary/80 to-accent",
                "from-accent to-accent/70",
                "from-accent/80 to-primary",
                "from-primary/60 to-accent/80",
                "from-accent/60 to-primary/80",
              ];
              const gradient = gradients[index % gradients.length];

              return (
                <Card key={member.userId} className="overflow-hidden card-hover group relative">
                  <div className={`h-1 bg-gradient-to-r ${gradient}`} />
                  <MemberActionsMenu
                    member={{
                      id: member.userId,
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
                        <PremiumAvatar
                          src={member.user.image || member.user.avatarUrl}
                          fallback={getInitials(member.user.name)}
                          isPremium={member.user.subscriptionTier !== "BASIC"}
                          size="lg"
                          className="border-2 border-background"
                          fallbackClassName={`bg-gradient-to-br ${gradient}`}
                        />
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

            {/* Pending Invitations */}
            {isAdmin && pendingInvitations.map((invitation) => (
              <Card key={invitation.id} className="overflow-hidden opacity-60 relative">
                <CancelInvitationButton
                  bubbleId={id}
                  invitationId={invitation.id}
                  email={invitation.email}
                />
                <div className="h-1 bg-gradient-to-r from-muted to-muted-foreground/30" />
                <CardContent className="pt-4 pb-4">
                  <div className="flex flex-col items-center text-center">
                    <div className="relative p-0.5 rounded-full bg-gradient-to-br from-muted to-muted-foreground/30 mb-3">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center border-2 border-background">
                        <span className="text-sm font-medium text-muted-foreground">
                          {getInitials(invitation.email.split("@")[0])}
                        </span>
                      </div>
                    </div>
                    <p className="font-semibold text-muted-foreground">{invitation.email}</p>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 gap-1 mt-2">
                      <Clock className="h-2.5 w-2.5" />
                      {t("detail.pending")}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat">
          <BubbleChat
            bubbleId={bubble.id}
            currentUserId={session.user.id}
            isAdmin={isAdmin}
            members={bubble.members.map((m) => ({
              id: m.user.id,
              name: m.user.name,
              avatarUrl: m.user.avatarUrl,
              image: m.user.image,
            }))}
          />
        </TabsContent>
      </Tabs>
      </div>
    </PinProtectedBubble>
  );
}
