"use client";

import { useTranslations } from "next-intl";
import { Clock, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ExpirationWarningProps {
  daysRemaining: number;
}

export function ExpirationWarning({ daysRemaining }: ExpirationWarningProps) {
  const t = useTranslations("guest.wishlist");

  if (daysRemaining > 3) {
    return (
      <Alert>
        <Clock className="h-4 w-4" />
        <AlertDescription>{t("expiresIn", { days: daysRemaining })}</AlertDescription>
      </Alert>
    );
  }

  if (daysRemaining === 0) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>{t("expiresToday")}</AlertTitle>
        <AlertDescription>{t("saveNow")}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>
        {daysRemaining === 1
          ? t("expiresTomorrow")
          : t("expiresIn", { days: daysRemaining })}
      </AlertTitle>
      <AlertDescription>{t("saveNow")}</AlertDescription>
    </Alert>
  );
}
