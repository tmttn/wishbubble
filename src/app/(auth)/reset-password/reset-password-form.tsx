"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTypedTranslations } from "@/i18n/useTypedTranslations";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Gift, Loader2, Lock, CheckCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

function ResetPasswordFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const t = useTypedTranslations("auth.resetPassword");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    if (!token) {
      toast.error(t("invalidLink"));
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Something went wrong");
      }

      setIsSuccess(true);
      toast.success(t("success"));

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-mesh flex items-center justify-center p-4">
        <Card className="relative w-full max-w-md border-0 bg-card/80 backdrop-blur-xl shadow-2xl shadow-primary/10">
          <CardHeader className="space-y-1 text-center pb-6">
            <CardTitle className="text-2xl font-bold text-destructive">
              {t("invalidLink")}
            </CardTitle>
            <CardDescription>{t("invalidLinkDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full h-12 rounded-xl" asChild>
              <Link href="/forgot-password">
                {t("requestNewLink")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
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
          <CardContent>
            <Button className="w-full h-12 rounded-xl" asChild>
              <Link href="/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("backToLogin")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-mesh flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-pulse-soft" />
        <div
          className="absolute top-1/2 -left-20 w-60 h-60 bg-accent/20 rounded-full blur-3xl animate-pulse-soft"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute -bottom-20 right-1/4 w-72 h-72 bg-primary/15 rounded-full blur-3xl animate-pulse-soft"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <Card className="relative w-full max-w-md border-0 bg-card/80 backdrop-blur-xl shadow-2xl shadow-primary/10 animate-scale-in">
        <CardHeader className="space-y-1 text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="rounded-2xl bg-gradient-to-br from-primary to-accent p-4 shadow-lg shadow-primary/30">
              <Gift className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold">
            {t("title")}
          </CardTitle>
          <CardDescription className="text-base">
            {t("subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">{t("newPassword")}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t("newPasswordPlaceholder")}
                autoComplete="new-password"
                disabled={isLoading}
                className="h-12 rounded-xl bg-background/50"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder={t("confirmPasswordPlaceholder")}
                autoComplete="new-password"
                disabled={isLoading}
                className="h-12 rounded-xl bg-background/50"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg shadow-primary/25 text-base font-medium"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Lock className="mr-2 h-5 w-5" />
              )}
              {t("submit")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export function ResetPasswordForm() {
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
      <ResetPasswordFormInner />
    </Suspense>
  );
}
