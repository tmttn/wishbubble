"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, ShieldCheck, ShieldOff, Loader2 } from "lucide-react";
import { PinSetupDialog } from "./pin-setup-dialog";

interface PinSettingsCardProps {
  bubbleId: string;
  bubbleName: string;
  isSecretSanta: boolean;
}

export function PinSettingsCard({
  bubbleId,
  bubbleName,
  isSecretSanta,
}: PinSettingsCardProps) {
  const t = useTranslations("bubbles.pin");

  const [isLoading, setIsLoading] = useState(true);
  const [hasPinProtection, setHasPinProtection] = useState(false);
  const [pinEnabledAt, setPinEnabledAt] = useState<string | null>(null);
  const [hasPassword, setHasPassword] = useState(true); // Default to true, will be updated
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"set" | "change" | "remove">("set");

  useEffect(() => {
    fetchPinStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bubbleId]);

  const fetchPinStatus = async () => {
    try {
      const response = await fetch(`/api/bubbles/${bubbleId}/pin`);
      const data = await response.json();

      if (response.ok) {
        setHasPinProtection(data.hasPinProtection);
        setPinEnabledAt(data.pinEnabledAt);
        setHasPassword(data.hasPassword ?? true);
      }
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (mode: "set" | "change" | "remove") => {
    setDialogMode(mode);
    setDialogOpen(true);
  };

  const handleSuccess = () => {
    fetchPinStatus();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Only show for Secret Santa bubbles
  if (!isSecretSanta) {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t("settings.title")}
          </CardTitle>
          <CardDescription>
            {t("settings.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading...</span>
            </div>
          ) : (
            <>
              {/* Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {hasPinProtection ? (
                    <>
                      <ShieldCheck className="h-5 w-5 text-accent" />
                      <div>
                        <p className="font-medium">{t("settings.enabled")}</p>
                        {pinEnabledAt && (
                          <p className="text-sm text-muted-foreground">
                            {t("settings.enabledSince", { date: formatDate(pinEnabledAt) })}
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <ShieldOff className="h-5 w-5 text-muted-foreground" />
                      <p className="font-medium">{t("settings.disabled")}</p>
                    </>
                  )}
                </div>
                <Badge variant={hasPinProtection ? "default" : "secondary"}>
                  {hasPinProtection ? t("settings.enabled") : t("settings.disabled")}
                </Badge>
              </div>

              {/* Hint */}
              <p className="text-sm text-muted-foreground">
                {t("settings.hint")}
              </p>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-2">
                {hasPinProtection ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleOpenDialog("change")}
                    >
                      {t("settings.changeButton")}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleOpenDialog("remove")}
                    >
                      {t("settings.removeButton")}
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => handleOpenDialog("set")}>
                    {t("settings.enableButton")}
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <PinSetupDialog
        key={dialogMode}
        bubbleId={bubbleId}
        bubbleName={bubbleName}
        hasExistingPin={hasPinProtection}
        hasPassword={hasPassword}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleSuccess}
        mode={dialogMode}
      />
    </>
  );
}
