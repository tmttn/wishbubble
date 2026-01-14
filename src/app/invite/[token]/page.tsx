"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTypedTranslations } from "@/i18n/useTypedTranslations";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gift, Loader2, Calendar, Users, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

interface InviteData {
  bubble: {
    id: string;
    name: string;
    description: string | null;
    occasionType: string;
    eventDate: string | null;
    _count: { members: number };
  };
  inviterName: string;
  email: string;
}

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default function InviteAcceptPage({ params }: InvitePageProps) {
  const { token } = use(params);
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();
  const t = useTypedTranslations("invite");
  const tToasts = useTypedTranslations("toasts");
  const tNav = useTypedTranslations("nav");
  const tAuth = useTypedTranslations("auth");

  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);

  useEffect(() => {
    const fetchInvite = async () => {
      try {
        const response = await fetch(`/api/invite/${token}`);
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Invalid invitation");
        }
        const data = await response.json();
        setInviteData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load invitation");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvite();
  }, [token]);

  const handleAccept = async () => {
    if (!session?.user) {
      // Redirect to login with callback
      router.push(`/login?callbackUrl=/invite/${token}`);
      return;
    }

    setIsAccepting(true);
    try {
      const response = await fetch(`/api/invite/${token}`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to accept invitation");
      }

      const data = await response.json();
      setIsAccepted(true);
      toast.success(tToasts("success.joinedBubble"));

      // Redirect to bubble after a short delay
      setTimeout(() => {
        router.push(`/bubbles/${data.bubbleId}`);
      }, 1500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : tToasts("error.joinFailed"));
    } finally {
      setIsAccepting(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date(dateStr));
  };

  if (isLoading || authStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-6">
            <XCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">{t("invalid")}</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button asChild>
              <Link href="/">{tNav("home")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isAccepted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-6">
            <CheckCircle className="h-12 w-12 mx-auto text-accent mb-4" />
            <h2 className="text-xl font-semibold mb-2">{t("youreIn")}</h2>
            <p className="text-muted-foreground">
              {t("redirecting")}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!inviteData) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <Gift className="h-12 w-12 text-primary" />
          </div>
          <CardTitle>{t("youreInvited")}</CardTitle>
          <CardDescription>
            {t("invitedBy", { name: inviteData.inviterName })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border p-4 space-y-3">
            <h3 className="font-semibold text-lg">{inviteData.bubble.name}</h3>
            {inviteData.bubble.description && (
              <p className="text-sm text-muted-foreground">
                {inviteData.bubble.description}
              </p>
            )}
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{t("members", { count: inviteData.bubble._count.members })}</span>
              </div>
              {inviteData.bubble.eventDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(inviteData.bubble.eventDate)}</span>
                </div>
              )}
            </div>
            <Badge variant="secondary">{inviteData.bubble.occasionType}</Badge>
          </div>

          {session?.user ? (
            <Button
              className="w-full"
              size="lg"
              onClick={handleAccept}
              disabled={isAccepting}
            >
              {isAccepting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("acceptInvitation")}
            </Button>
          ) : (
            <div className="space-y-3">
              <Button className="w-full" size="lg" asChild>
                <Link href={`/login?callbackUrl=/invite/${token}`}>
                  {tNav("login")}
                </Link>
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                {tAuth("register.haveAccount")}{" "}
                <Link
                  href={`/register?callbackUrl=/invite/${token}`}
                  className="text-primary hover:underline"
                >
                  {tNav("register")}
                </Link>
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
