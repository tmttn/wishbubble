import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Gift, Users, Calendar, ArrowRight } from "lucide-react";

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
                  select: { id: true, name: true, avatarUrl: true },
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
    if (!date) return "No date set";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const occasionLabels: Record<string, string> = {
    CHRISTMAS: "Christmas",
    BIRTHDAY: "Birthday",
    SINTERKLAAS: "Sinterklaas",
    WEDDING: "Wedding",
    BABY_SHOWER: "Baby Shower",
    GRADUATION: "Graduation",
    HOUSEWARMING: "Housewarming",
    OTHER: "Other",
  };

  return (
    <div className="container py-8">
      {/* Welcome Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, {session.user.name?.split(" ")[0] || "there"}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s what&apos;s happening with your gift exchanges.
          </p>
        </div>
        <Button asChild>
          <Link href="/bubbles/new">
            <Plus className="h-4 w-4 mr-2" />
            Create Bubble
          </Link>
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Bubbles</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bubbles.length}</div>
            <p className="text-xs text-muted-foreground">
              {bubbles.length === 1 ? "group" : "groups"} you&apos;re part of
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wishlist Items</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{wishlist?._count.items || 0}</div>
            <p className="text-xs text-muted-foreground">items on your wishlist</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bubbles.filter((b: typeof bubbles[number]) => b.bubble.eventDate && new Date(b.bubble.eventDate) > new Date()).length}
            </div>
            <p className="text-xs text-muted-foreground">events coming up</p>
          </CardContent>
        </Card>
      </div>

      {/* My Bubbles */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">My Bubbles</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/bubbles">
              View all
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>

        {bubbles.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No bubbles yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first bubble to start coordinating gifts with friends and family.
              </p>
              <Button asChild>
                <Link href="/bubbles/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Bubble
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {bubbles.map(({ bubble }: typeof bubbles[number]) => (
              <Link key={bubble.id} href={`/bubbles/${bubble.id}`}>
                <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{bubble.name}</CardTitle>
                        <CardDescription>
                          {occasionLabels[bubble.occasionType]}
                        </CardDescription>
                      </div>
                      {bubble.isSecretSanta && (
                        <Badge variant="secondary">Secret Santa</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {bubble.members.slice(0, 4).map((member: BubbleMemberWithBubble["bubble"]["members"][number]) => (
                          <Avatar key={member.user.id} className="h-8 w-8 border-2 border-background">
                            <AvatarImage src={member.user.avatarUrl || undefined} />
                            <AvatarFallback className="text-xs">
                              {getInitials(member.user.name)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {bubble._count.members > 4 && (
                          <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                            +{bubble._count.members - 4}
                          </div>
                        )}
                      </div>
                      {bubble.eventDate && (
                        <span className="text-sm text-muted-foreground">
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
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Button variant="outline" className="h-auto py-4 justify-start" asChild>
            <Link href="/wishlist">
              <Gift className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Edit Wishlist</div>
                <div className="text-xs text-muted-foreground">Add or update items</div>
              </div>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-4 justify-start" asChild>
            <Link href="/bubbles/new">
              <Plus className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">New Bubble</div>
                <div className="text-xs text-muted-foreground">Start a gift exchange</div>
              </div>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-4 justify-start" asChild>
            <Link href="/bubbles">
              <Users className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">All Bubbles</div>
                <div className="text-xs text-muted-foreground">View your groups</div>
              </div>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto py-4 justify-start" asChild>
            <Link href="/settings">
              <Calendar className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Settings</div>
                <div className="text-xs text-muted-foreground">Manage account</div>
              </div>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
