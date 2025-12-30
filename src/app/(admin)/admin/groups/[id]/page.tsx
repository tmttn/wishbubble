import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Users,
  Gift,
  ShoppingCart,
  Settings,
  Activity,
} from "lucide-react";

interface GroupDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminGroupDetailPage({
  params,
}: GroupDetailPageProps) {
  const { id } = await params;

  const group = await prisma.bubble.findUnique({
    where: { id },
    include: {
      owner: {
        select: { id: true, name: true, email: true, avatarUrl: true, image: true },
      },
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true, image: true },
          },
        },
        where: { leftAt: null },
        orderBy: { joinedAt: "asc" },
      },
      wishlists: {
        include: {
          wishlist: {
            include: {
              user: { select: { id: true, name: true } },
              _count: { select: { items: true } },
            },
          },
        },
      },
      claims: {
        include: {
          user: { select: { id: true, name: true } },
          item: { select: { title: true } },
        },
        orderBy: { claimedAt: "desc" },
        take: 20,
      },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      invitations: {
        where: { status: "PENDING" },
        orderBy: { sentAt: "desc" },
      },
      secretSantaDraws: {
        include: {
          giver: { select: { id: true, name: true } },
          receiver: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!group) notFound();

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/admin/groups">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Groups
        </Link>
      </Button>

      {/* Group header */}
      <Card className="border-0 bg-card/80 backdrop-blur-sm">
        <CardContent className="py-6">
          <div className="flex flex-col md:flex-row items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold">{group.name}</h1>
                <Badge variant="outline">{group.occasionType}</Badge>
                {group.isSecretSanta && (
                  <Badge variant={group.secretSantaDrawn ? "default" : "secondary"}>
                    {group.secretSantaDrawn ? "Secret Santa Drawn" : "Secret Santa"}
                  </Badge>
                )}
                {group.isPublic && <Badge variant="secondary">Public</Badge>}
                {group.archivedAt && <Badge variant="destructive">Archived</Badge>}
              </div>
              {group.description && (
                <p className="text-muted-foreground mt-2">{group.description}</p>
              )}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Group ID</p>
                  <p className="font-mono text-xs">{group.id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Slug</p>
                  <p className="font-mono text-xs">{group.slug}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Event Date</p>
                    <p>
                      {group.eventDate
                        ? group.eventDate.toLocaleDateString()
                        : "Not set"}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p>{group.createdAt.toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card className="border-0 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Budget</p>
              <p>
                {group.budgetMin || group.budgetMax
                  ? `${group.currency} ${group.budgetMin || "0"} - ${group.budgetMax || "∞"}`
                  : "Not set"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Currency</p>
              <p>{group.currency}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Max Members</p>
              <p>{group.maxMembers}</p>
            </div>
            <div>
              <p className="text-muted-foreground">External Links</p>
              <p>{group.allowExternalLinks ? "Allowed" : "Not allowed"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Owner */}
      <Card className="border-0 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">Owner</CardTitle>
        </CardHeader>
        <CardContent>
          <Link
            href={`/admin/users/${group.owner.id}`}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors w-fit"
          >
            <Avatar>
              <AvatarImage src={group.owner.avatarUrl || group.owner.image || undefined} />
              <AvatarFallback>
                {group.owner.name?.slice(0, 2).toUpperCase() || "??"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{group.owner.name || "No name"}</p>
              <p className="text-sm text-muted-foreground">{group.owner.email}</p>
            </div>
          </Link>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Members */}
        <Card className="border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Members ({group.members.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {group.members.map((membership) => (
                <Link
                  key={membership.id}
                  href={`/admin/users/${membership.user.id}`}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={membership.user.avatarUrl || membership.user.image || undefined}
                      />
                      <AvatarFallback className="text-xs">
                        {membership.user.name?.slice(0, 2).toUpperCase() || "??"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {membership.user.name || "No name"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {membership.user.email}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {membership.role}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Wishlists */}
        <Card className="border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Wishlists ({group.wishlists.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {group.wishlists.length === 0 ? (
              <p className="text-muted-foreground text-sm">No wishlists attached</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {group.wishlists.map((bw) => (
                  <div
                    key={bw.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-secondary/30"
                  >
                    <div>
                      <p className="text-sm font-medium">{bw.wishlist.name}</p>
                      <p className="text-xs text-muted-foreground">
                        by{" "}
                        <Link
                          href={`/admin/users/${bw.wishlist.user.id}`}
                          className="hover:underline"
                        >
                          {bw.wishlist.user.name || "Unknown"}
                        </Link>{" "}
                        · {bw.wishlist._count.items} items
                      </p>
                    </div>
                    <Badge variant={bw.isVisible ? "default" : "secondary"} className="text-xs">
                      {bw.isVisible ? "Visible" : "Hidden"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Secret Santa Draws */}
      {group.isSecretSanta && group.secretSantaDraws.length > 0 && (
        <Card className="border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Secret Santa Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {group.secretSantaDraws.map((draw) => (
                <div
                  key={draw.id}
                  className="p-3 rounded-lg bg-secondary/30 text-sm"
                >
                  <Link
                    href={`/admin/users/${draw.giver.id}`}
                    className="font-medium hover:underline"
                  >
                    {draw.giver.name || "Unknown"}
                  </Link>
                  <span className="text-muted-foreground"> → </span>
                  <Link
                    href={`/admin/users/${draw.receiver.id}`}
                    className="font-medium hover:underline"
                  >
                    {draw.receiver.name || "Unknown"}
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Invitations */}
      {group.invitations.length > 0 && (
        <Card className="border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg">Pending Invitations ({group.invitations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {group.invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-secondary/30"
                >
                  <p className="text-sm">{inv.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Expires: {inv.expiresAt.toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Claims */}
      <Card className="border-0 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Recent Claims ({group.claims.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {group.claims.length === 0 ? (
            <p className="text-muted-foreground text-sm">No claims yet</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {group.claims.map((claim) => (
                <div
                  key={claim.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-secondary/30"
                >
                  <div>
                    <p className="text-sm font-medium">{claim.item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      by{" "}
                      <Link
                        href={`/admin/users/${claim.user.id}`}
                        className="hover:underline"
                      >
                        {claim.user.name || "Unknown"}
                      </Link>
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={claim.status === "PURCHASED" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {claim.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {claim.claimedAt.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Log */}
      <Card className="border-0 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {group.activities.length === 0 ? (
            <p className="text-muted-foreground text-sm">No activity recorded</p>
          ) : (
            <div className="space-y-2">
              {group.activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-secondary/30"
                >
                  <Badge variant="outline" className="text-xs">
                    {activity.type}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    {activity.createdAt.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
