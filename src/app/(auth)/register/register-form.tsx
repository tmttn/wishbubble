"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useTypedTranslations } from "@/i18n/useTypedTranslations";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Gift, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { registerSchema, type RegisterInput } from "@/lib/validators/auth";

export function RegisterForm() {
  const router = useRouter();
  const t = useTypedTranslations("auth.register");
  const tToasts = useTypedTranslations("toasts");
  const tLegal = useTypedTranslations("legal");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || tToasts("error.registrationFailed"));
        return;
      }

      toast.success(tToasts("success.accountCreated"));

      // Sign in automatically
      const signInResult = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (signInResult?.error) {
        router.push("/login");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      toast.error(t("error"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch {
      toast.error(tToasts("error.googleSignInFailed"));
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-mesh flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute top-1/2 -left-20 w-60 h-60 bg-accent/20 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: "1s" }} />
        <div className="absolute -bottom-20 right-1/4 w-72 h-72 bg-primary/15 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: "2s" }} />
      </div>

      <Card className="relative w-full max-w-md border-0 bg-card/80 backdrop-blur-xl shadow-2xl shadow-primary/10 animate-scale-in my-8">
        <CardHeader className="space-y-1 text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="rounded-2xl bg-gradient-to-br from-primary to-accent p-4 shadow-lg shadow-primary/30">
              <Gift className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl sm:text-3xl font-bold">{t("title")}</CardTitle>
          <CardDescription className="text-base">
            {t("subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("name")}</Label>
              <Input
                id="name"
                type="text"
                placeholder={t("namePlaceholder")}
                autoComplete="name"
                disabled={isLoading}
                className="h-12 rounded-xl bg-background/50"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t("emailPlaceholder")}
                autoComplete="email"
                disabled={isLoading}
                className="h-12 rounded-xl bg-background/50"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t("passwordPlaceholder")}
                autoComplete="new-password"
                disabled={isLoading}
                className="h-12 rounded-xl bg-background/50"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
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
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
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
                <Sparkles className="mr-2 h-5 w-5" />
              )}
              {t("submit")}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="bg-border/50" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground">
                {t("orContinueWith")}
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full h-12 rounded-xl border-2 hover:bg-secondary/50 transition-colors"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
          >
            {isGoogleLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            {t("google")}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            {t("haveAccount")}{" "}
            <Link href="/login" className="text-primary font-medium hover:text-primary/80 transition-colors">
              {t("signIn")}
            </Link>
          </p>

          <p className="text-center text-xs text-muted-foreground">
            {t("agreeToTerms")}{" "}
            <Link href="/terms" className="underline hover:text-foreground transition-colors">
              {tLegal("terms.title")}
            </Link>{" "}
            {t("and")}{" "}
            <Link href="/privacy" className="underline hover:text-foreground transition-colors">
              {tLegal("privacy.title")}
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
