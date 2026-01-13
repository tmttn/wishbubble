"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2, Mail } from "lucide-react";

function VerifyEmailResultInner() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const error = searchParams.get("error");
  const t = useTranslations("auth.verifyEmail");

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case "missing-token":
        return t("errorMissingToken");
      case "invalid-token":
        return t("errorInvalidToken");
      case "expired-token":
        return t("errorExpiredToken");
      case "user-not-found":
        return t("errorUserNotFound");
      case "server-error":
        return t("errorServer");
      default:
        return t("errorGeneric");
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-mesh flex items-center justify-center p-4">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-pulse-soft" />
        </div>

        <Card className="relative w-full max-w-md border-0 bg-card/80 backdrop-blur-xl shadow-2xl shadow-primary/10 animate-scale-in">
          <CardHeader className="space-y-1 text-center pb-6">
            <div className="flex justify-center mb-4">
              <div className="rounded-2xl bg-gradient-to-br from-primary to-accent p-4 shadow-lg shadow-primary/30">
                <CheckCircle className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-bold">
              {t("successTitle")}
            </CardTitle>
            <CardDescription className="text-base">
              {t("successDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-accent"
              asChild
            >
              <Link href="/dashboard">{t("goToDashboard")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-mesh flex items-center justify-center p-4">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-destructive/20 rounded-full blur-3xl animate-pulse-soft" />
        </div>

        <Card className="relative w-full max-w-md border-0 bg-card/80 backdrop-blur-xl shadow-2xl shadow-primary/10 animate-scale-in">
          <CardHeader className="space-y-1 text-center pb-6">
            <div className="flex justify-center mb-4">
              <div className="rounded-2xl bg-gradient-to-br from-destructive to-red-600 p-4 shadow-lg shadow-destructive/30">
                <XCircle className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-bold">
              {t("errorTitle")}
            </CardTitle>
            <CardDescription className="text-base">
              {getErrorMessage(error)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full h-12 rounded-xl" variant="outline" asChild>
              <Link href="/login">{t("backToLogin")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default state - email sent, waiting for user to click link
  return (
    <div className="min-h-screen bg-gradient-mesh flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-pulse-soft" />
      </div>

      <Card className="relative w-full max-w-md border-0 bg-card/80 backdrop-blur-xl shadow-2xl shadow-primary/10 animate-scale-in">
        <CardHeader className="space-y-1 text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="rounded-2xl bg-gradient-to-br from-primary to-accent p-4 shadow-lg shadow-primary/30">
              <Mail className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold">
            {t("pendingTitle")}
          </CardTitle>
          <CardDescription className="text-base">
            {t("pendingDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            {t("checkSpam")}
          </p>
          <Button className="w-full h-12 rounded-xl" variant="outline" asChild>
            <Link href="/login">{t("backToLogin")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function VerifyEmailResult() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-mesh flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-gradient-to-br from-primary/20 to-accent/20 p-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </div>
        </div>
      }
    >
      <VerifyEmailResultInner />
    </Suspense>
  );
}
