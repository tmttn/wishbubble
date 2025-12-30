"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  createBubbleSchema,
  occasionTypes,
  type CreateBubbleInput,
} from "@/lib/validators/bubble";

export default function NewBubblePage() {
  const router = useRouter();
  const t = useTranslations("bubbles");
  const tOccasions = useTranslations("bubbles.occasions");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateBubbleInput>({
    resolver: zodResolver(createBubbleSchema),
    defaultValues: {
      currency: "EUR",
      isSecretSanta: false,
      maxMembers: 10,
    },
  });

  const isSecretSanta = watch("isSecretSanta");
  const occasionType = watch("occasionType");

  const onSubmit = async (data: CreateBubbleInput) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/bubbles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create bubble");
      }

      const bubble = await response.json();
      toast.success("Bubble created successfully!");
      router.push(`/bubbles/${bubble.id}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create bubble"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/bubbles">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Bubbles
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {t("create.title")}
          </CardTitle>
          <CardDescription>
            Create a new bubble for your gift exchange event
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">{t("create.name")} *</Label>
              <Input
                id="name"
                placeholder={t("create.namePlaceholder")}
                disabled={isLoading}
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">{t("create.description")}</Label>
              <Textarea
                id="description"
                placeholder={t("create.descriptionPlaceholder")}
                disabled={isLoading}
                {...register("description")}
              />
              {errors.description && (
                <p className="text-sm text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* Occasion Type */}
            <div className="space-y-2">
              <Label>{t("create.occasionType")} *</Label>
              <Select
                value={occasionType}
                onValueChange={(value) =>
                  setValue("occasionType", value as typeof occasionTypes[number])
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an occasion" />
                </SelectTrigger>
                <SelectContent>
                  {occasionTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {tOccasions(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.occasionType && (
                <p className="text-sm text-destructive">
                  {errors.occasionType.message}
                </p>
              )}
            </div>

            {/* Event Date */}
            <div className="space-y-2">
              <Label htmlFor="eventDate">{t("create.eventDate")}</Label>
              <Input
                id="eventDate"
                type="date"
                disabled={isLoading}
                {...register("eventDate")}
              />
              {errors.eventDate && (
                <p className="text-sm text-destructive">
                  {errors.eventDate.message}
                </p>
              )}
            </div>

            {/* Budget Range */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budgetMin">{t("create.budgetMin")}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    &euro;
                  </span>
                  <Input
                    id="budgetMin"
                    type="number"
                    min="0"
                    step="0.01"
                    className="pl-8"
                    placeholder="0"
                    disabled={isLoading}
                    {...register("budgetMin")}
                  />
                </div>
                {errors.budgetMin && (
                  <p className="text-sm text-destructive">
                    {errors.budgetMin.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="budgetMax">{t("create.budgetMax")}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    &euro;
                  </span>
                  <Input
                    id="budgetMax"
                    type="number"
                    min="0"
                    step="0.01"
                    className="pl-8"
                    placeholder="50"
                    disabled={isLoading}
                    {...register("budgetMax")}
                  />
                </div>
                {errors.budgetMax && (
                  <p className="text-sm text-destructive">
                    {errors.budgetMax.message}
                  </p>
                )}
              </div>
            </div>

            {/* Secret Santa Toggle */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="isSecretSanta" className="text-base">
                  {t("create.isSecretSanta")}
                </Label>
                <p className="text-sm text-muted-foreground">
                  Enable random name assignment for gift exchanges
                </p>
              </div>
              <Switch
                id="isSecretSanta"
                checked={isSecretSanta}
                onCheckedChange={(checked) => setValue("isSecretSanta", checked)}
                disabled={isLoading}
              />
            </div>

            {/* Submit */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("create.submit")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
