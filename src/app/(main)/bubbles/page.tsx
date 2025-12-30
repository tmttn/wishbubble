import { redirect } from "next/navigation";
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
import { Plus, Users, Calendar, Gift } from "lucide-react";

export default async function BubblesPage() {
  const session = await auth();
  const t = await getTranslations("bubbles");
  const tOccasions = await getTranslations("bubbles.occasions");

  if (!session?.user?.id) {
    redirect("/login");
  }

  const bubbles = await prisma.bubble.findMany({
    where: {
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
            select: { id: true, name: true, avatarUrl: true },
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
  });

  const formatDate = (date: Date | null) => {
    if (!date) return null;
    return new Intl.DateTimeFormat("en-US", {
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

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground mt-1">
            Manage your gift exchange groups
          </p>
        </div>
        <Button asChild>
          <Link href="/bubbles/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Bubble
          </Link>
        </Button>
      </div>

      {bubbles.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No bubbles yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first bubble to start coordinating gifts!
            </p>
            <Button asChild>
              <Link href="/bubbles/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Bubble
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {bubbles.map((bubble) => {
            const daysUntil = getDaysUntil(bubble.eventDate);
            const isOwner = bubble.ownerId === session.user.id;

            return (
              <Link key={bubble.id} href={`/bubbles/${bubble.id}`}>
                <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="line-clamp-1">
                          {bubble.name}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {tOccasions(bubble.occasionType)}
                        </CardDescription>
                      </div>
                      <div className="flex gap-1">
                        {isOwner && (
                          <Badge variant="secondary">Owner</Badge>
                        )}
                        {bubble.isSecretSanta && (
                          <Badge variant="outline">Secret Santa</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {bubble.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {bubble.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{bubble.members.length} members</span>
                      </div>
                      {bubble.eventDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(bubble.eventDate)}</span>
                        </div>
                      )}
                    </div>

                    {daysUntil !== null && daysUntil > 0 && daysUntil <= 30 && (
                      <div className="mt-3">
                        <Badge
                          variant={daysUntil <= 7 ? "destructive" : "secondary"}
                        >
                          {daysUntil} days left
                        </Badge>
                      </div>
                    )}

                    {bubble.budgetMin || bubble.budgetMax ? (
                      <div className="mt-3 text-sm text-muted-foreground">
                        Budget: {bubble.currency}{" "}
                        {bubble.budgetMin && bubble.budgetMax
                          ? `${bubble.budgetMin} - ${bubble.budgetMax}`
                          : bubble.budgetMax
                          ? `up to ${bubble.budgetMax}`
                          : `from ${bubble.budgetMin}`}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
