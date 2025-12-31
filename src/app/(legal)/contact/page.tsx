"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import Script from "next/script";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail, Send, Loader2, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const RECAPTCHA_SITE_KEY = "6LdHXDwsAAAAANLgvaC11LjY2CdOXC1bXpiqNh-T";

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

type ContactSubject =
  | "PRIVACY_REQUEST"
  | "DATA_DELETION"
  | "DATA_EXPORT"
  | "BUG_REPORT"
  | "FEATURE_REQUEST"
  | "GENERAL_INQUIRY"
  | "OTHER";

export default function ContactPage() {
  const t = useTranslations("contact");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [recaptchaReady, setRecaptchaReady] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "" as ContactSubject | "",
    message: "",
  });

  useEffect(() => {
    // Check if reCAPTCHA is already loaded
    if (typeof window !== "undefined" && window.grecaptcha) {
      window.grecaptcha.ready(() => setRecaptchaReady(true));
    }
  }, []);

  const handleRecaptchaLoad = useCallback(() => {
    if (typeof window !== "undefined" && window.grecaptcha) {
      window.grecaptcha.ready(() => setRecaptchaReady(true));
    }
  }, []);

  const getRecaptchaToken = async (): Promise<string | null> => {
    if (!recaptchaReady || !window.grecaptcha) {
      console.error("reCAPTCHA not ready");
      return null;
    }

    try {
      return await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: "contact" });
    } catch (error) {
      console.error("reCAPTCHA execution failed:", error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error(t("errors.allFieldsRequired"));
      return;
    }

    setIsSubmitting(true);

    try {
      const recaptchaToken = await getRecaptchaToken();
      if (!recaptchaToken) {
        toast.error(t("errors.recaptchaFailed"));
        return;
      }

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          recaptchaToken,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to submit");
      }

      setIsSubmitted(true);
      toast.success(t("success"));
    } catch (error) {
      console.error("Contact form submission failed:", error);
      toast.error(t("errors.submitFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="container max-w-2xl py-12">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">{t("submitted.title")}</h2>
            <p className="text-muted-foreground mb-6">{t("submitted.description")}</p>
            <Button asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t("submitted.backHome")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Script
        src={`https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`}
        onLoad={handleRecaptchaLoad}
      />
      <div className="container max-w-2xl py-12">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-3xl">{t("title")}</CardTitle>
            <p className="text-muted-foreground mt-2">{t("description")}</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">{t("form.name")}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t("form.namePlaceholder")}
                  maxLength={100}
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">{t("form.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={t("form.emailPlaceholder")}
                  required
                />
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <Label htmlFor="subject">{t("form.subject")}</Label>
                <Select
                  value={formData.subject}
                  onValueChange={(value) =>
                    setFormData({ ...formData, subject: value as ContactSubject })
                  }
                >
                  <SelectTrigger id="subject">
                    <SelectValue placeholder={t("form.subjectPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRIVACY_REQUEST">{t("subjects.privacyRequest")}</SelectItem>
                    <SelectItem value="DATA_DELETION">{t("subjects.dataDeletion")}</SelectItem>
                    <SelectItem value="DATA_EXPORT">{t("subjects.dataExport")}</SelectItem>
                    <SelectItem value="BUG_REPORT">{t("subjects.bugReport")}</SelectItem>
                    <SelectItem value="FEATURE_REQUEST">{t("subjects.featureRequest")}</SelectItem>
                    <SelectItem value="GENERAL_INQUIRY">{t("subjects.generalInquiry")}</SelectItem>
                    <SelectItem value="OTHER">{t("subjects.other")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message">{t("form.message")}</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder={t("form.messagePlaceholder")}
                  rows={6}
                  maxLength={5000}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {formData.message.length}/5000
                </p>
              </div>

              {/* Privacy notice */}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50">
                <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  {t("privacyNotice")}{" "}
                  <Link href="/privacy" className="underline hover:text-foreground">
                    {t("privacyPolicy")}
                  </Link>
                </p>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || !recaptchaReady}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t("form.submitting")}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    {t("form.submit")}
                  </>
                )}
              </Button>

              {/* reCAPTCHA badge notice */}
              <p className="text-xs text-center text-muted-foreground">
                {t("recaptchaNotice")}
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
