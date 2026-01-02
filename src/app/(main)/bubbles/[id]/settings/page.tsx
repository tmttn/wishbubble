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
import { ArrowLeft, AlertTriangle, Settings2 } from "lucide-react";
import { TransferOwnershipDialog } from "@/components/bubbles/transfer-ownership-dialog";
import { LeaveGroupDialog } from "@/components/bubbles/leave-group-dialog";
import { DeleteGroupDialog } from "@/components/bubbles/delete-group-dialog";
import { BubbleSettingsForm } from "@/components/bubbles/bubble-settings-form";

interface SettingsPageProps {
  params: Promise<{ id: string }>;
}

export default async function BubbleSettingsPage({ params }: SettingsPageProps) {
  const { id } = await params;
  const session = await auth();
  const t = await getTranslations("bubbles");

  if (!session?.user?.id) {
    redirect("/login");
  }

  const bubble = await prisma.bubble.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      eventDate: true,
      budgetMin: true,
      budgetMax: true,
      ownerId: true,
      revealGivers: true,
      allowMemberWishlists: true,
      members: {
        where: { leftAt: null },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true, image: true },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
    },
  });

  if (!bubble) {
    notFound();
  }

  // Check if user is a member
  const currentMember = bubble.members.find((m) => m.userId === session.user.id);
  if (!currentMember) {
    redirect("/bubbles");
  }

  const isOwner = bubble.ownerId === session.user.id;
  const isAdmin = currentMember.role === "ADMIN" || isOwner;

  // Only admins can access settings
  if (!isAdmin) {
    redirect(`/bubbles/${id}`);
  }

  // Get other members (excluding owner) for transfer ownership
  const otherMembers = bubble.members.filter((m) => m.userId !== session.user.id);

  return (
    <div className="container py-8 max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/bubbles/${id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("detail.backToBubbles")}
          </Link>
        </Button>
      </div>

      <h1 className="text-3xl font-bold mb-2">{t("settings.title")}</h1>
      <p className="text-muted-foreground mb-8">{bubble.name}</p>

      <div className="space-y-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              {t("settings.general.title")}
            </CardTitle>
            <CardDescription>
              {t("settings.general.description")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BubbleSettingsForm
              bubbleId={bubble.id}
              name={bubble.name}
              description={bubble.description}
              eventDate={bubble.eventDate}
              budgetMin={bubble.budgetMin ? Number(bubble.budgetMin) : null}
              budgetMax={bubble.budgetMax ? Number(bubble.budgetMax) : null}
              revealGivers={bubble.revealGivers}
              allowMemberWishlists={bubble.allowMemberWishlists}
              isOwner={isOwner}
            />
          </CardContent>
        </Card>

        {/* Ownership Section - Only for owners */}
        {isOwner && otherMembers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("settings.ownership.title")}</CardTitle>
              <CardDescription>
                {t("settings.ownership.description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TransferOwnershipDialog
                bubbleId={bubble.id}
                members={otherMembers.map((m) => ({
                  id: m.id,
                  userId: m.userId,
                  role: m.role,
                  user: {
                    id: m.user.id,
                    name: m.user.name,
                    email: m.user.email,
                    avatarUrl: m.user.avatarUrl,
                    image: m.user.image,
                  },
                }))}
              />
            </CardContent>
          </Card>
        )}

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {t("settings.dangerZone.title")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isOwner ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {t("settings.dangerZone.deleteDescription")}
                </p>
                <DeleteGroupDialog bubbleId={bubble.id} bubbleName={bubble.name} />
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {t("settings.dangerZone.leaveDescription")}
                </p>
                <LeaveGroupDialog bubbleId={bubble.id} bubbleName={bubble.name} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
