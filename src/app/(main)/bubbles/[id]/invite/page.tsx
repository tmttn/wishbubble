"use client";

import * as Sentry from "@sentry/nextjs";
import { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Loader2, Mail, Plus, X, Check, AlertCircle, Users, Crown, Link2, Copy, AlertTriangle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const inviteSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type InviteInput = z.infer<typeof inviteSchema>;

interface InviteResult {
  email: string;
  status: "sent" | "already_member" | "already_invited" | "email_failed" | "limit_reached";
}

interface MemberLimit {
  current: number;
  limit: number;
  pendingInvites: number;
  canInvite: boolean;
  upgradeRequired: boolean;
}

interface InvitePageProps {
  params: Promise<{ id: string }>;
}

export default function InvitePage({ params }: InvitePageProps) {
  const { id: bubbleId } = use(params);
  const router = useRouter();
  const t = useTranslations("invite");
  const tCommon = useTranslations("common");
  const tToasts = useTranslations("toasts");
  const [emails, setEmails] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<InviteResult[]>([]);
  const [memberLimit, setMemberLimit] = useState<MemberLimit | null>(null);
  const [isLoadingLimit, setIsLoadingLimit] = useState(true);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [isLoadingLink, setIsLoadingLink] = useState(false);
  const [isResettingLink, setIsResettingLink] = useState(false);

  useEffect(() => {
    const fetchInviteLink = async () => {
      setIsLoadingLink(true);
      try {
        const response = await fetch(`/api/bubbles/${bubbleId}/invite-link`);
        if (response.ok) {
          const data = await response.json();
          setInviteLink(data.inviteLink);
        }
      } catch (error) {
        Sentry.captureException(error, { tags: { component: "InvitePage", action: "fetchInviteLink" } });
      } finally {
        setIsLoadingLink(false);
      }
    };
    fetchInviteLink();
  }, [bubbleId]);

  useEffect(() => {
    const fetchMemberLimit = async () => {
      try {
        const response = await fetch(`/api/bubbles/${bubbleId}`);
        if (response.ok) {
          const data = await response.json();
          setMemberLimit(data.memberLimit);
        }
      } catch (error) {
        Sentry.captureException(error, { tags: { component: "InvitePage", action: "fetchMemberLimit" } });
      } finally {
        setIsLoadingLimit(false);
      }
    };
    fetchMemberLimit();
  }, [bubbleId]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteInput>({
    resolver: zodResolver(inviteSchema),
  });

  const addEmail = (data: InviteInput) => {
    if (!emails.includes(data.email)) {
      setEmails([...emails, data.email]);
    }
    reset();
  };

  const removeEmail = (email: string) => {
    setEmails(emails.filter((e) => e !== email));
  };

  const sendInvitations = async () => {
    if (emails.length === 0) {
      toast.error(tToasts("error.addEmailFirst"));
      return;
    }

    setIsLoading(true);
    setResults([]);

    try {
      const response = await fetch(`/api/bubbles/${bubbleId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || tToasts("error.inviteFailed"));
      }

      const data = await response.json();
      setResults(data.results);

      const sentCount = data.results.filter(
        (r: InviteResult) => r.status === "sent"
      ).length;

      if (sentCount > 0) {
        toast.success(tToasts("success.invitationsSent", { count: sentCount }));
        setEmails([]);
        // Refetch member limit after sending invitations
        const limitResponse = await fetch(`/api/bubbles/${bubbleId}`);
        if (limitResponse.ok) {
          const limitData = await limitResponse.json();
          setMemberLimit(limitData.memberLimit);
        }
      } else {
        toast.info(tToasts("success.noNewInvitations"));
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : tToasts("error.inviteFailed")
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate available slots
  const availableSlots = memberLimit
    ? memberLimit.limit === -1
      ? Infinity
      : memberLimit.limit - memberLimit.current - memberLimit.pendingInvites
    : Infinity;

  const isLimitReached = !!(memberLimit && memberLimit.limit !== -1 && availableSlots <= 0);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <Check className="h-4 w-4 text-accent" />;
      case "already_member":
      case "already_invited":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <X className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "sent":
        return t("status.sent");
      case "already_member":
        return t("status.alreadyMember");
      case "already_invited":
        return t("status.alreadyInvited");
      case "email_failed":
        return t("status.failed");
      case "limit_reached":
        return t("status.limitReached");
      default:
        return status;
    }
  };

  const copyInviteLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast.success(tToasts("success.linkCopied"));
    } catch {
      toast.error(tToasts("error.copyFailed"));
    }
  };

  const resetInviteLink = async () => {
    setIsResettingLink(true);
    try {
      const response = await fetch(`/api/bubbles/${bubbleId}/invite-link`, {
        method: "DELETE",
      });
      if (response.ok) {
        const data = await response.json();
        setInviteLink(data.inviteLink);
        toast.success(tToasts("success.linkReset"));
      }
    } catch (error) {
      Sentry.captureException(error, { tags: { component: "InvitePage", action: "resetInviteLink" } });
      toast.error(tToasts("error.resetFailed"));
    } finally {
      setIsResettingLink(false);
    }
  };

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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            {t("title")}
          </CardTitle>
          <CardDescription>
            {t("description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Member limit indicator */}
          {!isLoadingLimit && memberLimit && memberLimit.limit !== -1 && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {t("memberLimit", {
                    current: memberLimit.current,
                    limit: memberLimit.limit,
                  })}
                  {memberLimit.pendingInvites > 0 && (
                    <span className="text-muted-foreground ml-1">
                      ({t("pendingInvites", { count: memberLimit.pendingInvites })})
                    </span>
                  )}
                </span>
              </div>
              {availableSlots > 0 && availableSlots !== Infinity && (
                <Badge variant="secondary">
                  {t("slotsAvailable", { count: availableSlots })}
                </Badge>
              )}
            </div>
          )}

          {/* Limit reached warning */}
          {isLimitReached && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{t("limitReachedMessage")}</span>
                {memberLimit?.upgradeRequired && (
                  <Button variant="outline" size="sm" asChild className="ml-4">
                    <Link href="/pricing">
                      <Crown className="mr-1 h-3 w-3" />
                      {t("upgrade")}
                    </Link>
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Shareable invite link */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              {t("inviteLink.title")}
            </Label>
            <div className="flex gap-2">
              <Input
                value={inviteLink || ""}
                readOnly
                className="font-mono text-sm"
                disabled={isLoadingLink}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={copyInviteLink}
                disabled={isLoadingLink || !inviteLink}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={resetInviteLink}
                disabled={isLoadingLink || isResettingLink}
                title={t("inviteLink.reset")}
              >
                {isResettingLink ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {t("inviteLink.warning")}
              </AlertDescription>
            </Alert>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                {tCommon("or")}
              </span>
            </div>
          </div>

          {/* Email input */}
          <form onSubmit={handleSubmit(addEmail)} className="flex gap-2">
            <div className="flex-1">
              <Input
                type="email"
                placeholder={t("emailPlaceholder")}
                {...register("email")}
                disabled={isLimitReached}
              />
              {errors.email && (
                <p className="text-sm text-destructive mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>
            <Button type="submit" variant="outline" disabled={isLimitReached}>
              <Plus className="h-4 w-4" />
            </Button>
          </form>

          {/* Email list */}
          {emails.length > 0 && (
            <div className="space-y-2">
              <Label>{t("emailsToInvite", { count: emails.length })}</Label>
              <div className="flex flex-wrap gap-2">
                {emails.map((email) => (
                  <Badge key={email} variant="secondary" className="pr-1">
                    {email}
                    <button
                      onClick={() => removeEmail(email)}
                      className="ml-2 hover:bg-muted rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-2">
              <Label>{t("results")}</Label>
              <div className="space-y-2">
                {results.map((result) => (
                  <div
                    key={result.email}
                    className="flex items-center justify-between p-2 rounded border"
                  >
                    <span className="text-sm">{result.email}</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result.status)}
                      <span className="text-sm text-muted-foreground">
                        {getStatusText(result.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Send button */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.back()}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              className="flex-1"
              onClick={sendInvitations}
              disabled={emails.length === 0 || isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {emails.length !== 1
                ? t("sendInvitationsPlural", { count: emails.length })
                : t("sendInvitations", { count: emails.length })}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
