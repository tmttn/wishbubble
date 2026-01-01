import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canCreateGroup, getUserTier } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PremiumAvatar } from "@/components/ui/premium-avatar";
import { Progress } from "@/components/ui/progress";
import { Plus, Users, Calendar, Gift, Sparkles, Crown } from "lucide-react";

export default async function BubblesPage() {
  const session = await auth();
  const t = await getTranslations("bubbles");
  const tOccasions = await getTranslations("bubbles.occasions");
  const locale = await getLocale();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch bubbles, limits, and tier in parallel
  const [bubbles, limitCheck, tier] = await Promise.all([
    prisma.bubble.findMany({
      where: {
        archivedAt: null,
        members: {
          some: {
            userId: session.user.id,
            leftAt: null,
          },
        },
      },
      include: {
        members: {
          where: { leftAt: null },
          include: {
            user: {
              select: { id: true, name: true, image: true, avatarUrl: true, subscriptionTier: true },
            },
          },
        },
        owner: {
          select: { id: true, name: true },
        },
        _count: {
          select: {
            wishlists: true,
            claims: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    canCreateGroup(session.user.id),
    getUserTier(session.user.id),
  ]);

  // Count owned groups (for limit display)
  const ownedGroups = bubbles.filter((b) => b.ownerId === session.user.id).length;
  const isFreePlan = tier === "FREE";

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return null;
    return new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const getDaysUntil = (date: Date | null) => {
    if (!date) return null;
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  const occasionGradients: Record<string, string> = {
    CHRISTMAS: "from-red-600 to-green-600",
    BIRTHDAY: "from-primary to-accent",
    SINTERKLAAS: "from-orange-500 to-red-500",
    WEDDING: "from-accent to-primary/70",
    BABY_SHOWER: "from-sky-400 to-primary/60",
    GRADUATION: "from-primary/80 to-primary",
    HOUSEWARMING: "from-amber-500 to-orange-500",
    OTHER: "from-primary/60 to-accent/60",
  };

  return (
    <div className="min-h-screen bg-gradient-mesh">
      <div className="container px-4 sm:px-6 py-6 md:py-10">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8 md:mb-10">
          <div className="animate-slide-up">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">
              {t("title")}
            </h1>
            <p className="text-muted-foreground mt-1 sm:mt-2">
              {t("subtitle")}
            </p>

            {/* Limits indicator - show for all users with limits */}
            {limitCheck.limit > 0 && (
              <div className="mt-3 p-3 rounded-lg bg-muted/50 space-y-2 max-w-sm">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t("limits.groupsOwned", {
                        current: ownedGroups,
                        max: limitCheck.limit,
                      })}
                    </span>
                  </div>
                  <Progress
                    value={(ownedGroups / limitCheck.limit) * 100}
                    className="h-1.5"
                  />
                </div>
                {isFreePlan && (
                  <Link
                    href="/pricing"
                    className="flex items-center justify-center gap-2 text-sm text-primary hover:underline pt-1"
                  >
                    <Crown className="h-3.5 w-3.5" />
                    {t("limits.upgradeToPremium")}
                  </Link>
                )}
              </div>
            )}
          </div>
          <Button className="group rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/20 w-full sm:w-auto" asChild>
            <Link href="/bubbles/new">
              <Plus className="mr-2 h-4 w-4" />
              {t("createButton")}
              <Sparkles className="h-4 w-4 ml-2 transition-colors group-hover:text-yellow-200" />
            </Link>
          </Button>
        </div>

        {bubbles.length === 0 ? (
          <Card className="border-dashed border-2 bg-card/50 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-16 md:py-20 px-4">
              <div className="rounded-full bg-gradient-to-br from-primary/20 to-accent/20 p-5 mb-6">
                <Gift className="h-12 w-12 md:h-14 md:w-14 text-primary" />
              </div>
              <h3 className="text-xl md:text-2xl font-semibold mb-3 text-center">{t("empty.title")}</h3>
              <p className="text-muted-foreground text-center mb-8 max-w-md">
                {t("empty.description")}
              </p>
              <Button className="rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/20" size="lg" asChild>
                <Link href="/bubbles/new">
                  <Plus className="mr-2 h-5 w-5" />
                  {t("empty.cta")}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {bubbles.map((bubble, index) => {
              const daysUntil = getDaysUntil(bubble.eventDate);
              const isOwner = bubble.ownerId === session.user.id;
              const gradient = occasionGradients[bubble.occasionType] || occasionGradients.OTHER;

              return (
                <Link key={bubble.id} href={`/bubbles/${bubble.id}`}>
                  <Card className="group h-full border-0 bg-card/80 backdrop-blur-sm card-hover overflow-hidden" style={{ animationDelay: `${index * 0.05}s` }}>
                    {/* Gradient top bar */}
                    <div className={`h-1.5 bg-gradient-to-r ${gradient}`} />

                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-lg md:text-xl line-clamp-1 group-hover:text-primary transition-colors">
                            {bubble.name}
                          </CardTitle>
                          <CardDescription className="mt-1 flex items-center gap-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r ${gradient} text-white`}>
                              {tOccasions(bubble.occasionType)}
                            </span>
                          </CardDescription>
                        </div>
                        <div className="flex flex-col gap-1 items-end shrink-0">
                          {isOwner && (
                            <Badge variant="secondary" className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-0">
                              <Crown className="h-3 w-3 mr-1" />
                              {t("card.owner")}
                            </Badge>
                          )}
                          {bubble.isSecretSanta && (
                            <Badge variant="secondary" className="bg-gradient-to-r from-primary/10 to-accent/10 text-primary border-0">
                              <Sparkles className="h-3 w-3 mr-1" />
                              Secret Santa
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {bubble.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {bubble.description}
                        </p>
                      )}

                      {/* Members and date row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-2">
                            {bubble.members.slice(0, 3).map((member) => (
                              <div key={member.user.id} className="ring-2 ring-background rounded-full">
                                <PremiumAvatar
                                  src={member.user.image || member.user.avatarUrl}
                                  fallback={getInitials(member.user.name)}
                                  isPremium={member.user.subscriptionTier !== "FREE"}
                                  size="sm"
                                />
                              </div>
                            ))}
                            {bubble.members.length > 3 && (
                              <div className="h-7 w-7 rounded-full bg-muted ring-2 ring-background flex items-center justify-center text-[10px] font-medium">
                                +{bubble.members.length - 3}
                              </div>
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {bubble.members.length}
                          </span>
                        </div>

                        {bubble.eventDate && (
                          <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(bubble.eventDate)}
                          </span>
                        )}
                      </div>

                      {/* Countdown and budget */}
                      <div className="flex items-center justify-between pt-2 border-t border-border/50">
                        {daysUntil !== null && daysUntil > 0 && daysUntil <= 30 ? (
                          <Badge
                            variant={daysUntil <= 7 ? "destructive" : "secondary"}
                            className={daysUntil <= 7 ? "animate-pulse" : ""}
                          >
                            {t("card.daysLeft", { count: daysUntil })}
                          </Badge>
                        ) : (
                          <div />
                        )}

                        {(bubble.budgetMin || bubble.budgetMax) && (
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                            {bubble.currency}{" "}
                            {bubble.budgetMin && bubble.budgetMax
                              ? `${bubble.budgetMin} - ${bubble.budgetMax}`
                              : bubble.budgetMax
                              ? `up to ${bubble.budgetMax}`
                              : `from ${bubble.budgetMin}`}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
