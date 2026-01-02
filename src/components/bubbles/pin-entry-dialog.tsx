"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Lock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PinEntryDialogProps {
  bubbleId: string;
  bubbleName: string;
  open: boolean;
  onSuccess: () => void;
  onCancel?: () => void;
}

export function PinEntryDialog({
  bubbleId,
  bubbleName,
  open,
  onSuccess,
  onCancel,
}: PinEntryDialogProps) {
  const router = useRouter();
  const t = useTranslations("bubbles.pin");

  const [pin, setPin] = useState<string[]>(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [open]);

  // Clear state when dialog closes
  useEffect(() => {
    if (!open) {
      setPin(["", "", "", "", "", ""]);
      setError(null);
      setIsLoading(false);
    }
  }, [open]);

  // Countdown for retry timer
  useEffect(() => {
    if (retryAfter && retryAfter > 0) {
      const timer = setInterval(() => {
        setRetryAfter((prev) => {
          if (prev && prev > 1) return prev - 1;
          return null;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [retryAfter]);

  const handleInputChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError(null);

    // Move to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when complete (4-6 digits)
    const fullPin = newPin.join("");
    if (fullPin.length >= 4 && !newPin.slice(0, fullPin.length).includes("")) {
      // Check if we have a complete PIN (no gaps)
      const firstEmpty = newPin.findIndex((d) => d === "");
      if (firstEmpty === -1 || firstEmpty >= 4) {
        handleSubmit(fullPin.slice(0, firstEmpty === -1 ? 6 : firstEmpty));
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter") {
      const fullPin = pin.join("");
      if (fullPin.length >= 4) {
        handleSubmit(fullPin);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pastedData) {
      const newPin = [...pin];
      for (let i = 0; i < pastedData.length && i < 6; i++) {
        newPin[i] = pastedData[i];
      }
      setPin(newPin);
      setError(null);

      // Focus the next empty input or the last one
      const nextEmpty = newPin.findIndex((d) => d === "");
      if (nextEmpty !== -1) {
        inputRefs.current[nextEmpty]?.focus();
      } else {
        inputRefs.current[5]?.focus();
      }

      // Auto-submit if complete
      if (pastedData.length >= 4) {
        handleSubmit(pastedData);
      }
    }
  };

  const handleSubmit = useCallback(async (pinValue: string) => {
    if (isLoading || retryAfter) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/bubbles/${bubbleId}/verify-pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinValue }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setRetryAfter(data.retryAfter || 60);
          setError(t("error.tooManyAttempts"));
        } else if (response.status === 401) {
          setAttemptsRemaining(data.attemptsRemaining);
          setError(t("error.invalidPin"));
          // Clear the PIN inputs
          setPin(["", "", "", "", "", ""]);
          setTimeout(() => inputRefs.current[0]?.focus(), 100);
        } else {
          setError(data.error || t("error.generic"));
        }
        return;
      }

      // Success!
      toast.success(t("success.verified"));
      onSuccess();
    } catch {
      setError(t("error.generic"));
    } finally {
      setIsLoading(false);
    }
  }, [bubbleId, isLoading, retryAfter, t, onSuccess]);

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.push("/bubbles");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">{t("entry.title")}</DialogTitle>
          <DialogDescription className="text-center">
            {t("entry.description", { bubbleName })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* PIN Input */}
          <div className="flex justify-center gap-2">
            {pin.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                disabled={isLoading || !!retryAfter}
                className={cn(
                  "h-12 w-10 text-center text-xl font-bold",
                  error && "border-destructive",
                  index === 3 && "ml-2" // Visual separator after 4th digit
                )}
                aria-label={`PIN digit ${index + 1}`}
              />
            ))}
          </div>

          {/* Hint about PIN length */}
          <p className="text-center text-xs text-muted-foreground">
            {t("entry.hint")}
          </p>

          {/* Error Message */}
          {error && (
            <div className="flex items-center justify-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {/* Attempts Remaining */}
          {attemptsRemaining !== null && attemptsRemaining > 0 && !retryAfter && (
            <p className="text-center text-xs text-muted-foreground">
              {t("entry.attemptsRemaining", { count: attemptsRemaining })}
            </p>
          )}

          {/* Retry Timer */}
          {retryAfter && (
            <p className="text-center text-sm text-muted-foreground">
              {t("entry.retryIn", { seconds: retryAfter })}
            </p>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="flex justify-center">
          <Button variant="ghost" onClick={handleCancel} disabled={isLoading}>
            {t("entry.cancel")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
