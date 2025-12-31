"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Crown, ArrowLeft } from "lucide-react";

interface LimitReachedProps {
  current: number;
  limit: number;
  upgradeRequired: boolean;
}

export function LimitReached({ current, limit, upgradeRequired }: LimitReachedProps) {
  const t = useTranslations("bubbles.create.limitReached");

  return (
    <div className="container max-w-md py-16">
      <Card className="text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Crown className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>
            {t("description", { current, limit })}
          </CardDescription>
        </CardHeader>
        {upgradeRequired && (
          <CardContent>
            <p className="text-muted-foreground">{t("upgradeMessage")}</p>
          </CardContent>
        )}
        <CardFooter className="flex flex-col gap-3">
          {upgradeRequired && (
            <Button asChild className="w-full">
              <Link href="/pricing">
                <Crown className="mr-2 h-4 w-4" />
                {t("upgradeCta")}
              </Link>
            </Button>
          )}
          <Button variant="outline" asChild className="w-full">
            <Link href="/bubbles">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("backToGroups")}
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
