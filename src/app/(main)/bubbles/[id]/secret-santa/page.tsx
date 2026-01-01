"use client";

import * as Sentry from "@sentry/nextjs";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Loader2,
  Shuffle,
  Gift,
  AlertTriangle,
  PartyPopper,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

interface SecretSantaPageProps {
  params: Promise<{ id: string }>;
}

interface Assignment {
  receiver: {
    id: string;
    name: string | null;
    image: string | null;
    avatarUrl: string | null;
  };
  viewedAt: string;
}

export default function SecretSantaPage({ params }: SecretSantaPageProps) {
  const { id: bubbleId } = use(params);
  const router = useRouter();
  const t = useTranslations("secretSanta");
  const tCommon = useTranslations("common");
  const tToasts = useTranslations("toasts");
  const tConfirmations = useTranslations("confirmations");

  const [isLoading, setIsLoading] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [bubbleInfo, setBubbleInfo] = useState<{
    name: string;
    isDrawn: boolean;
    memberCount: number;
    isAdmin: boolean;
  } | null>(null);
  const [showReveal, setShowReveal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch bubble info
        const bubbleRes = await fetch(`/api/bubbles/${bubbleId}`);
        if (!bubbleRes.ok) throw new Error("Failed to fetch bubble");
        const bubble = await bubbleRes.json();

        setBubbleInfo({
          name: bubble.name,
          isDrawn: bubble.secretSantaDrawn,
          memberCount: bubble.members?.length || 0,
          isAdmin: bubble.isOwner || bubble.isAdmin,
        });

        // Fetch assignment if draw is done
        if (bubble.secretSantaDrawn) {
          const drawRes = await fetch(`/api/bubbles/${bubbleId}/draw`);
          if (drawRes.ok) {
            const data = await drawRes.json();
            setAssignment(data.assignment);
          }
        }
      } catch (error) {
        Sentry.captureException(error, { tags: { component: "SecretSantaPage", action: "fetchData" } });
        toast.error(tToasts("error.secretSantaLoadFailed"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [bubbleId]);

  const handleDraw = async () => {
    if (!confirm(tConfirmations("drawNames"))) {
      return;
    }

    setIsDrawing(true);
    try {
      const response = await fetch(`/api/bubbles/${bubbleId}/draw`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || tToasts("error.drawFailed"));
      }

      toast.success(tToasts("success.namesDrawn"));

      // Refresh the page to show the assignment
      window.location.reload();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : tToasts("error.drawFailed")
      );
    } finally {
      setIsDrawing(false);
    }
  };

  const handleResetDraw = async () => {
    if (!confirm(tConfirmations("redrawNames"))) {
      return;
    }

    setIsResetting(true);
    try {
      const response = await fetch(`/api/bubbles/${bubbleId}/draw`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || tToasts("error.resetDrawFailed"));
      }

      toast.success(tToasts("success.drawReset"));

      // Refresh the page to show the pre-draw state
      window.location.reload();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : tToasts("error.resetDrawFailed")
      );
    } finally {
      setIsResetting(false);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="container py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/bubbles/${bubbleId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {tCommon("back")}
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Shuffle className="h-12 w-12 text-primary" />
          </div>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>
            {bubbleInfo?.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!bubbleInfo?.isDrawn ? (
            // Pre-draw state
            <div className="text-center space-y-6">
              <div className="py-8">
                <Gift className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {t("readyToDraw")}
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {t("drawDescription")}
                </p>
              </div>

              {bubbleInfo && bubbleInfo.memberCount < 3 && (
                <div className="flex items-center gap-2 p-4 rounded-lg bg-yellow-500/10 text-yellow-600">
                  <AlertTriangle className="h-5 w-5 shrink-0" />
                  <p className="text-sm">
                    {t("minimumMembers")}
                  </p>
                </div>
              )}

              {bubbleInfo?.isAdmin ? (
                <Button
                  size="lg"
                  onClick={handleDraw}
                  disabled={
                    isDrawing || (bubbleInfo?.memberCount || 0) < 3
                  }
                >
                  {isDrawing && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  <Shuffle className="mr-2 h-4 w-4" />
                  {t("drawNames")}
                </Button>
              ) : (
                <p className="text-muted-foreground">
                  {t("waitingForDraw")}
                </p>
              )}
            </div>
          ) : assignment ? (
            // Post-draw state with assignment
            <div className="text-center space-y-6">
              {!showReveal ? (
                <div className="py-8">
                  <PartyPopper className="h-16 w-16 mx-auto text-primary mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {t("namesDrawn")}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {t("revealDescription")}
                  </p>
                  <div className="flex flex-col gap-3 items-center">
                    <Button size="lg" onClick={() => setShowReveal(true)}>
                      <Gift className="mr-2 h-4 w-4" />
                      {t("revealAssignment")}
                    </Button>
                    {bubbleInfo?.isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleResetDraw}
                        disabled={isResetting}
                        className="text-muted-foreground"
                      >
                        {isResetting ? (
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        ) : (
                          <RotateCcw className="mr-2 h-3 w-3" />
                        )}
                        {t("redrawNames")}
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-8">
                  <div className="mb-6">
                    <Avatar className="h-24 w-24 mx-auto mb-4">
                      <AvatarImage
                        src={assignment.receiver.image || assignment.receiver.avatarUrl || undefined}
                      />
                      <AvatarFallback className="text-2xl">
                        {getInitials(assignment.receiver.name)}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-muted-foreground">
                      {t("buyingFor")}
                    </p>
                    <h2 className="text-3xl font-bold mt-2">
                      {assignment.receiver.name}
                    </h2>
                  </div>

                  <div className="flex flex-col gap-3 items-center">
                    <Button asChild variant="outline">
                      <Link href={`/bubbles/${bubbleId}`}>
                        {t("viewWishlist")}
                      </Link>
                    </Button>
                    {bubbleInfo?.isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleResetDraw}
                        disabled={isResetting}
                        className="text-muted-foreground"
                      >
                        {isResetting ? (
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        ) : (
                          <RotateCcw className="mr-2 h-3 w-3" />
                        )}
                        {t("redrawNames")}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Post-draw but no assignment (shouldn't happen normally)
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t("noAssignment")}</h3>
              <p className="text-muted-foreground">
                {t("noAssignmentDescription")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
