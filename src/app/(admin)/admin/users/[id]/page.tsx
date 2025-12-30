import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Calendar,
  Clock,
  Users2,
  Gift,
  ShoppingCart,
} from "lucide-react";

interface UserDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminUserDetailPage({
  params,
}: UserDetailPageProps) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      bubbleMemberships: {
        include: {
          bubble: {
            select: {
              id: true,
              name: true,
              occasionType: true,
              eventDate: true,
              _count: { select: { members: true } },
            },
          },
        },
        where: { leftAt: null },
        orderBy: { joinedAt: "desc" },
      },
      wishlists: {
        include: { _count: { select: { items: true } } },
        orderBy: { createdAt: "desc" },
      },
      claims: {
        where: { status: { in: ["CLAIMED", "PURCHASED"] } },
        include: {
          item: { select: { id: true, title: true } },
          bubble: { select: { id: true, name: true } },
        },
        take: 10,
        orderBy: { claimedAt: "desc" },
      },
    },
  });

  if (!user) notFound();

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/admin/users">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </Link>
      </Button>

      {/* User header */}
      <Card className="border-0 bg-card/80 backdrop-blur-sm">
        <CardContent className="py-6">
          <div className="flex flex-col md:flex-row items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.avatarUrl || user.image || undefined} />
              <AvatarFallback className="text-2xl">
                {user.name?.slice(0, 2).toUpperCase() || "??"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold">
                  {user.name || "No name"}
                </h1>
                <Badge>{user.subscriptionTier}</Badge>
                {user.isAdmin && <Badge variant="destructive">Admin</Badge>}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground mt-1">
                <Mail className="h-4 w-4" />
                {user.email}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                <div>
                  <p className="text-muted-foreground">User ID</p>
                  <p className="font-mono text-xs">{user.id}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Joined</p>
                    <p>{user.createdAt.toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Last Login</p>
                    <p>
                      {user.lastLoginAt
                        ? user.lastLoginAt.toLocaleDateString()
                        : "Never"}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground">Email Verified</p>
                  <p>
                    {user.emailVerified
                      ? user.emailVerified.toLocaleDateString()
                      : "No"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card className="border-0 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">Notification Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <Badge variant={user.notifyEmail ? "default" : "secondary"}>
              Email: {user.notifyEmail ? "On" : "Off"}
            </Badge>
            <Badge variant={user.notifyInApp ? "default" : "secondary"}>
              In-App: {user.notifyInApp ? "On" : "Off"}
            </Badge>
            <Badge variant={user.notifyDigest ? "default" : "secondary"}>
              Digest: {user.notifyDigest ? "On" : "Off"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Groups */}
        <Card className="border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users2 className="h-5 w-5" />
              Groups ({user.bubbleMemberships.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user.bubbleMemberships.length === 0 ? (
              <p className="text-muted-foreground text-sm">No groups joined</p>
            ) : (
              <div className="space-y-2">
                {user.bubbleMemberships.map((membership) => (
                  <Link
                    key={membership.bubble.id}
                    href={`/admin/groups/${membership.bubble.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{membership.bubble.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {membership.role} · {membership.bubble._count.members}{" "}
                        members
                      </p>
                    </div>
                    <Badge variant="outline">
                      {membership.bubble.occasionType}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Wishlists */}
        <Card className="border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Wishlists ({user.wishlists.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user.wishlists.length === 0 ? (
              <p className="text-muted-foreground text-sm">No wishlists</p>
            ) : (
              <div className="space-y-2">
                {user.wishlists.map((wishlist) => (
                  <div
                    key={wishlist.id}
                    className="p-3 rounded-lg bg-secondary/30"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{wishlist.name}</p>
                      {wishlist.isDefault && (
                        <Badge variant="secondary" className="text-xs">
                          Default
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {wishlist._count.items} items
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Claims */}
      <Card className="border-0 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Recent Claims ({user.claims.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {user.claims.length === 0 ? (
            <p className="text-muted-foreground text-sm">No claims</p>
          ) : (
            <div className="space-y-2">
              {user.claims.map((claim) => (
                <div
                  key={claim.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
                >
                  <div>
                    <p className="font-medium">{claim.item.title}</p>
                    <p className="text-sm text-muted-foreground">
                      in{" "}
                      <Link
                        href={`/admin/groups/${claim.bubble.id}`}
                        className="hover:underline"
                      >
                        {claim.bubble.name}
                      </Link>
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        claim.status === "PURCHASED" ? "default" : "secondary"
                      }
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
    </div>
  );
}
