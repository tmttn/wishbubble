import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Users2, Gift, ShoppingCart, TrendingUp, Calendar } from "lucide-react";
import Link from "next/link";
import { DashboardCharts } from "@/components/admin/dashboard-charts";
import { getTranslations } from "next-intl/server";

export default async function AdminDashboardPage() {
  const t = await getTranslations("admin.dashboard");
  const [userCount, groupCount, itemCount, claimStats, recentUsers, recentGroups] =
    await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.bubble.count({ where: { archivedAt: null } }),
      prisma.wishlistItem.count({ where: { deletedAt: null } }),
      prisma.claim.groupBy({ by: ["status"], _count: true }),
      prisma.user.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, name: true, email: true, createdAt: true },
      }),
      prisma.bubble.findMany({
        where: { archivedAt: null },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          occasionType: true,
          createdAt: true,
          _count: { select: { members: true } },
        },
      }),
    ]);

  const claimedCount = claimStats.find((s) => s.status === "CLAIMED")?._count || 0;
  const purchasedCount = claimStats.find((s) => s.status === "PURCHASED")?._count || 0;

  const stats = [
    { label: t("stats.totalUsers"), value: userCount, icon: Users, href: "/admin/users" },
    { label: t("stats.activeGroups"), value: groupCount, icon: Users2, href: "/admin/groups" },
    { label: t("stats.wishlistItems"), value: itemCount, icon: Gift, href: "/admin/items" },
    { label: t("stats.activeClaims"), value: claimedCount, icon: ShoppingCart, href: "/admin/claims?status=CLAIMED" },
    { label: t("stats.purchased"), value: purchasedCount, icon: TrendingUp, href: "/admin/claims?status=PURCHASED" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => {
          const CardWrapper = stat.href ? Link : "div";
          return (
            <CardWrapper
              key={stat.label}
              href={stat.href || ""}
              className={stat.href ? "block" : ""}
            >
              <Card className="border-0 bg-card/80 backdrop-blur-sm hover:bg-card/90 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            </CardWrapper>
          );
        })}
      </div>

      {/* Growth Charts */}
      <DashboardCharts />

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Users */}
        <Card className="border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">{t("recentUsers")}</CardTitle>
            <Link
              href="/admin/users"
              className="text-sm text-primary hover:underline"
            >
              {t("viewAll")}
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <Link
                  key={user.id}
                  href={`/admin/users/${user.id}`}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {user.name || t("noName")}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {user.createdAt.toLocaleDateString()}
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Groups */}
        <Card className="border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">{t("recentGroups")}</CardTitle>
            <Link
              href="/admin/groups"
              className="text-sm text-primary hover:underline"
            >
              {t("viewAll")}
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentGroups.map((group) => (
                <Link
                  key={group.id}
                  href={`/admin/groups/${group.id}`}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-medium truncate">{group.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {group.occasionType} · {t("members", { count: group._count.members })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {group.createdAt.toLocaleDateString()}
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
