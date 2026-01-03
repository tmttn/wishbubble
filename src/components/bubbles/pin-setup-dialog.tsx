"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, Eye, EyeOff, AlertCircle, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

type Mode = "set" | "change" | "remove";

interface PinSetupDialogProps {
  bubbleId: string;
  bubbleName: string;
  hasExistingPin: boolean;
  hasPassword: boolean; // Whether user has a password (false for OAuth-only users)
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  mode?: Mode;
}

export function PinSetupDialog({
  bubbleId,
  bubbleName,
  hasExistingPin,
  hasPassword,
  open,
  onOpenChange,
  onSuccess,
  mode: initialMode,
}: PinSetupDialogProps) {
  const t = useTranslations("bubbles.pin");

  const [mode, setMode] = useState<Mode>(initialMode || (hasExistingPin ? "change" : "set"));
  const [step, setStep] = useState<"auth" | "newPin" | "confirm">("auth");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [password, setPassword] = useState("");
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const passwordRef = useRef<HTMLInputElement>(null);
  const currentPinRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null, null, null]);
  const newPinRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null, null, null]);
  const confirmPinRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null, null, null]);

  // Split PIN into array for individual inputs (always 6 elements)
  const currentPinDigits = [...currentPin.split(""), ...Array(6).fill("")].slice(0, 6);
  const newPinDigits = [...newPin.split(""), ...Array(6).fill("")].slice(0, 6);
  const confirmPinDigits = [...confirmPin.split(""), ...Array(6).fill("")].slice(0, 6);

  const handlePinInputChange = useCallback((
    setter: (value: string) => void,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
    currentValue: string,
    index: number,
    value: string
  ) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const digits = [...currentValue.split(""), ...Array(6).fill("")].slice(0, 6);
    digits[index] = value;
    // Join and trim trailing empty strings
    const newValue = digits.join("").replace(/\s+$/, "");
    setter(newValue);
    setError(null);

    // Move to next input
    if (value && index < 5) {
      refs.current[index + 1]?.focus();
    }
  }, []);

  const handlePinKeyDown = useCallback((
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
    currentValue: string,
    index: number,
    e: React.KeyboardEvent
  ) => {
    const digits = [...currentValue.split(""), ...Array(6).fill("")].slice(0, 6);
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  }, []);

  const handlePinPaste = useCallback((
    setter: (value: string) => void,
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
    e: React.ClipboardEvent
  ) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pastedData) {
      setter(pastedData);
      setError(null);

      // Focus the next empty input or the last one
      const nextEmpty = pastedData.length < 6 ? pastedData.length : 5;
      refs.current[nextEmpty]?.focus();
    }
  }, []);

  // For OAuth users setting a new PIN, skip the auth step entirely
  const skipAuthStep = !hasExistingPin && !hasPassword && mode === "set";

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      const newMode = initialMode || (hasExistingPin ? "change" : "set");
      setMode(newMode);
      // Skip auth step for OAuth users setting a new PIN
      const shouldSkipAuth = !hasExistingPin && !hasPassword && newMode === "set";
      setStep(shouldSkipAuth ? "newPin" : "auth");
      setPassword("");
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
      setError(null);
      setShowPassword(false);
    }
  }, [open, hasExistingPin, hasPassword, initialMode]);

  // Focus appropriate input when step changes
  useEffect(() => {
    if (!open) return;
    setTimeout(() => {
      if (step === "auth") {
        if (hasExistingPin || mode === "change" || mode === "remove") {
          currentPinRefs.current[0]?.focus();
        } else {
          passwordRef.current?.focus();
        }
      } else if (step === "newPin") {
        newPinRefs.current[0]?.focus();
      } else if (step === "confirm") {
        confirmPinRefs.current[0]?.focus();
      }
    }, 100);
  }, [step, open, hasExistingPin, mode]);

  const validatePin = (pin: string): boolean => {
    return /^\d{4,6}$/.test(pin);
  };

  const handleAuthSubmit = () => {
    setError(null);

    if (mode === "remove") {
      // For remove, verify current PIN and submit
      if (!validatePin(currentPin)) {
        setError(t("error.invalidPinFormat"));
        return;
      }
      handleRemovePin();
      return;
    }

    if (hasExistingPin || mode === "change") {
      // Verify current PIN format
      if (!validatePin(currentPin)) {
        setError(t("error.invalidPinFormat"));
        return;
      }
    } else {
      // Verify password
      if (!password || password.length < 8) {
        setError(t("error.passwordRequired"));
        return;
      }
    }

    // Move to new PIN step
    setStep("newPin");
  };

  const handleNewPinSubmit = () => {
    setError(null);

    if (!validatePin(newPin)) {
      setError(t("error.invalidPinFormat"));
      return;
    }

    // Move to confirm step
    setStep("confirm");
  };

  const handleConfirmSubmit = async () => {
    setError(null);

    if (newPin !== confirmPin) {
      setError(t("error.pinMismatch"));
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/bubbles/${bubbleId}/pin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pin: newPin,
          password: hasExistingPin ? undefined : password,
          currentPin: hasExistingPin ? currentPin : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t("error.generic"));
        // If current PIN is wrong, go back to auth step
        if (data.error?.includes("Current PIN")) {
          setStep("auth");
          setCurrentPin("");
        }
        return;
      }

      toast.success(hasExistingPin ? t("success.changed") : t("success.enabled"));
      onSuccess();
      onOpenChange(false);
    } catch {
      setError(t("error.generic"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemovePin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/bubbles/${bubbleId}/pin`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPin }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t("error.generic"));
        return;
      }

      toast.success(t("success.removed"));
      onSuccess();
      onOpenChange(false);
    } catch {
      setError(t("error.generic"));
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    if (mode === "remove") return t("setup.removeTitle");
    if (hasExistingPin || mode === "change") return t("setup.changeTitle");
    return t("setup.title");
  };

  const getDescription = () => {
    if (mode === "remove") return t("setup.removeDescription");
    if (hasExistingPin || mode === "change") return t("setup.changeDescription");
    return t("setup.description", { bubbleName });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">{getTitle()}</DialogTitle>
          <DialogDescription className="text-center">
            {getDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Step indicator */}
          {mode !== "remove" && (
            <div className="flex justify-center gap-2 mb-6">
              {(skipAuthStep ? ["newPin", "confirm"] : ["auth", "newPin", "confirm"]).map((s, i, arr) => (
                <div
                  key={s}
                  className={cn(
                    "h-2 w-8 rounded-full transition-colors",
                    step === s
                      ? "bg-primary"
                      : i < arr.indexOf(step)
                        ? "bg-primary/50"
                        : "bg-muted"
                  )}
                />
              ))}
            </div>
          )}

          {/* Auth Step */}
          {step === "auth" && (
            <div className="space-y-4">
              {hasExistingPin || mode === "change" || mode === "remove" ? (
                <div className="space-y-2">
                  <Label className="text-center block">{t("setup.currentPin")}</Label>
                  <div className="flex justify-center gap-2">
                    {currentPinDigits.map((digit, index) => (
                      <Input
                        key={index}
                        ref={(el) => { currentPinRefs.current[index] = el; }}
                        type="password"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handlePinInputChange(setCurrentPin, currentPinRefs, currentPin, index, e.target.value)}
                        onKeyDown={(e) => handlePinKeyDown(currentPinRefs, currentPin, index, e)}
                        onPaste={index === 0 ? (e) => handlePinPaste(setCurrentPin, currentPinRefs, e) : undefined}
                        disabled={isLoading}
                        className={cn(
                          "h-12 w-10 text-center text-xl font-bold",
                          error && "border-destructive",
                          index === 3 && "ml-2"
                        )}
                        aria-label={`Current PIN digit ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="password">{t("setup.password")}</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      ref={passwordRef}
                      type={showPassword ? "text" : "password"}
                      placeholder="********"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError(null);
                      }}
                      disabled={isLoading}
                      className={cn(error && "border-destructive", "pr-10")}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("setup.passwordHint")}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* New PIN Step */}
          {step === "newPin" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-center block">{t("setup.newPin")}</Label>
                <div className="flex justify-center gap-2">
                  {newPinDigits.map((digit, index) => (
                    <Input
                      key={index}
                      ref={(el) => { newPinRefs.current[index] = el; }}
                      type="password"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handlePinInputChange(setNewPin, newPinRefs, newPin, index, e.target.value)}
                      onKeyDown={(e) => handlePinKeyDown(newPinRefs, newPin, index, e)}
                      onPaste={index === 0 ? (e) => handlePinPaste(setNewPin, newPinRefs, e) : undefined}
                      disabled={isLoading}
                      className={cn(
                        "h-12 w-10 text-center text-xl font-bold",
                        error && "border-destructive",
                        index === 3 && "ml-2"
                      )}
                      aria-label={`New PIN digit ${index + 1}`}
                    />
                  ))}
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  {t("setup.pinHint")}
                </p>
              </div>
            </div>
          )}

          {/* Confirm Step */}
          {step === "confirm" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-center block">{t("setup.confirmPin")}</Label>
                <div className="flex justify-center gap-2">
                  {confirmPinDigits.map((digit, index) => (
                    <Input
                      key={index}
                      ref={(el) => { confirmPinRefs.current[index] = el; }}
                      type="password"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handlePinInputChange(setConfirmPin, confirmPinRefs, confirmPin, index, e.target.value)}
                      onKeyDown={(e) => handlePinKeyDown(confirmPinRefs, confirmPin, index, e)}
                      onPaste={index === 0 ? (e) => handlePinPaste(setConfirmPin, confirmPinRefs, e) : undefined}
                      disabled={isLoading}
                      className={cn(
                        "h-12 w-10 text-center text-xl font-bold",
                        error && "border-destructive",
                        index === 3 && "ml-2"
                      )}
                      aria-label={`Confirm PIN digit ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          {step !== "auth" && mode !== "remove" && !(step === "newPin" && skipAuthStep) && (
            <Button
              variant="outline"
              onClick={() => setStep(step === "confirm" ? "newPin" : "auth")}
              disabled={isLoading}
            >
              {t("setup.back")}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {t("setup.cancel")}
          </Button>
          <Button
            onClick={() => {
              if (step === "auth") handleAuthSubmit();
              else if (step === "newPin") handleNewPinSubmit();
              else handleConfirmSubmit();
            }}
            disabled={isLoading}
            variant={mode === "remove" ? "destructive" : "default"}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "remove"
              ? t("setup.removeButton")
              : step === "confirm"
                ? hasExistingPin ? t("setup.updateButton") : t("setup.enableButton")
                : t("setup.nextButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
