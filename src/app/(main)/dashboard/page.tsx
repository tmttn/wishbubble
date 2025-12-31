import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Gift, Users, Calendar, ArrowRight, Sparkles, Settings } from "lucide-react";

type BubbleMemberWithBubble = {
  bubble: {
    id: string;
    name: string;
    occasionType: string;
    eventDate: Date | null;
    isSecretSanta: boolean;
    members: Array<{
      user: {
        id: string;
        name: string | null;
        image: string | null;
        avatarUrl: string | null;
      };
    }>;
    _count: {
      members: number;
    };
  };
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const [t, tOccasions, locale] = await Promise.all([
    getTranslations("dashboard"),
    getTranslations("bubbles.occasions"),
    getLocale(),
  ]);

  // Fetch user's bubbles and wishlist
  const [bubbles, wishlist] = await Promise.all([
    prisma.bubbleMember.findMany({
      where: {
        userId: session.user.id,
        leftAt: null,
      },
      include: {
        bubble: {
          include: {
            members: {
              where: { leftAt: null },
              include: {
                user: {
                  select: { id: true, name: true, image: true, avatarUrl: true },
                },
              },
              take: 5,
            },
            _count: {
              select: { members: true },
            },
          },
        },
      },
      orderBy: {
        joinedAt: "desc",
      },
      take: 6,
    }) as unknown as BubbleMemberWithBubble[],
    prisma.wishlist.findFirst({
      where: {
        userId: session.user.id,
        isDefault: true,
      },
      include: {
        _count: {
          select: { items: true },
        },
      },
    }),
  ]);

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
    if (!date) return t("myBubbles.noDateSet");
    return new Intl.DateTimeFormat(locale === "nl" ? "nl-NL" : "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const upcomingEventsCount = bubbles.filter((b: typeof bubbles[number]) => b.bubble.eventDate && new Date(b.bubble.eventDate) > new Date()).length;

  const stats = [
    {
      title: t("stats.activeBubbles"),
      value: bubbles.length,
      description: t("stats.activeBubblesDesc", { count: bubbles.length }),
      icon: Users,
      gradient: "from-purple-500 to-pink-500",
    },
    {
      title: t("stats.wishlistItems"),
      value: wishlist?._count.items || 0,
      description: t("stats.wishlistItemsDesc"),
      icon: Gift,
      gradient: "from-pink-500 to-rose-500",
    },
    {
      title: t("stats.upcomingEvents"),
      value: upcomingEventsCount,
      description: t("stats.upcomingEventsDesc"),
      icon: Calendar,
      gradient: "from-rose-500 to-orange-500",
    },
  ];

  const quickActions = [
    {
      title: t("quickActions.editWishlist"),
      description: t("quickActions.editWishlistDesc"),
      icon: Gift,
      href: "/wishlist",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      title: t("quickActions.createBubble"),
      description: t("quickActions.createBubbleDesc"),
      icon: Plus,
      href: "/bubbles/new",
      gradient: "from-pink-500 to-rose-500",
    },
    {
      title: t("quickActions.viewBubbles"),
      description: t("quickActions.viewBubblesDesc"),
      icon: Users,
      href: "/bubbles",
      gradient: "from-rose-500 to-orange-500",
    },
    {
      title: t("quickActions.settings"),
      description: t("quickActions.settingsDesc"),
      icon: Settings,
      href: "/settings",
      gradient: "from-orange-500 to-amber-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-mesh">
      <div className="container px-4 sm:px-6 py-6 md:py-10">
        {/* Welcome Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8 md:mb-10">
          <div className="animate-slide-up">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">
              {t("welcome")}{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {session.user.name?.split(" ")[0] || "there"}
              </span>
              !
            </h1>
            <p className="text-muted-foreground mt-1 sm:mt-2">
              {t("subtitle")}
            </p>
          </div>
          <Button className="group rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/20 w-full sm:w-auto" asChild>
            <Link href="/bubbles/new">
              <Plus className="h-4 w-4 mr-2" />
              {t("quickActions.createBubble")}
              <Sparkles className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-8 md:mb-10">
          {stats.map((stat, index) => (
            <Card key={stat.title} className="relative overflow-hidden border-0 bg-card/80 backdrop-blur-sm card-hover" style={{ animationDelay: `${index * 0.1}s` }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <div className={`rounded-xl bg-gradient-to-br ${stat.gradient} p-2.5 shadow-lg`}>
                  <stat.icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl md:text-4xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
              {/* Decorative gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
            </Card>
          ))}
        </div>

        {/* My Bubbles */}
        <div className="mb-8 md:mb-10">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-xl md:text-2xl font-semibold">{t("myBubbles.title")}</h2>
            <Button variant="ghost" size="sm" className="group" asChild>
              <Link href="/bubbles">
                {t("myBubbles.viewAll")}
                <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>

          {bubbles.length === 0 ? (
            <Card className="border-dashed border-2 bg-card/50 backdrop-blur-sm">
              <CardContent className="flex flex-col items-center justify-center py-12 md:py-16 px-4">
                <div className="rounded-full bg-gradient-to-br from-primary/20 to-accent/20 p-4 mb-4">
                  <Users className="h-10 w-10 md:h-12 md:w-12 text-primary" />
                </div>
                <h3 className="text-lg md:text-xl font-semibold mb-2 text-center">{t("myBubbles.empty")}</h3>
                <p className="text-muted-foreground text-center mb-6 max-w-sm">
                  {t("myBubbles.emptyDescription")}
                </p>
                <Button className="rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/20" asChild>
                  <Link href="/bubbles/new">
                    <Plus className="h-4 w-4 mr-2" />
                    {t("myBubbles.createFirst")}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {bubbles.map(({ bubble }: typeof bubbles[number], index) => (
                <Link key={bubble.id} href={`/bubbles/${bubble.id}`}>
                  <Card className="h-full border-0 bg-card/80 backdrop-blur-sm card-hover" style={{ animationDelay: `${index * 0.05}s` }}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-lg truncate">{bubble.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {tOccasions(bubble.occasionType)}
                          </CardDescription>
                        </div>
                        {bubble.isSecretSanta && (
                          <Badge variant="secondary" className="shrink-0 bg-gradient-to-r from-primary/10 to-accent/10 text-primary border-0">
                            <Sparkles className="h-3 w-3 mr-1" />
                            {t("myBubbles.secretSanta")}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex -space-x-2">
                          {bubble.members.slice(0, 4).map((member: BubbleMemberWithBubble["bubble"]["members"][number]) => (
                            <Avatar key={member.user.id} className="h-8 w-8 ring-2 ring-background">
                              <AvatarImage src={member.user.image || member.user.avatarUrl || undefined} />
                              <AvatarFallback className="text-xs bg-gradient-to-br from-primary to-accent text-white">
                                {getInitials(member.user.name)}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {bubble._count.members > 4 && (
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-muted to-muted/50 ring-2 ring-background flex items-center justify-center text-xs font-medium">
                              +{bubble._count.members - 4}
                            </div>
                          )}
                        </div>
                        {bubble.eventDate && (
                          <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(bubble.eventDate)}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6">{t("quickActions.title")}</h2>
          <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action, index) => (
              <Link key={action.title} href={action.href}>
                <Card className="group h-full border-0 bg-card/80 backdrop-blur-sm card-hover cursor-pointer" style={{ animationDelay: `${index * 0.05}s` }}>
                  <CardContent className="p-4 md:p-5">
                    <div className="flex items-center gap-4">
                      <div className={`shrink-0 rounded-xl bg-gradient-to-br ${action.gradient} p-3 shadow-lg group-hover:scale-110 transition-transform`}>
                        <action.icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-base truncate">{action.title}</div>
                        <div className="text-sm text-muted-foreground">{action.description}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
