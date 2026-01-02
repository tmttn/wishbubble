"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface BubbleSettingsFormProps {
  bubbleId: string;
  name: string;
  description: string | null;
  eventDate: Date | null;
  budgetMin: number | null;
  budgetMax: number | null;
  revealGivers: boolean;
  allowMemberWishlists: boolean;
  isOwner: boolean;
}

export function BubbleSettingsForm({
  bubbleId,
  name: initialName,
  description: initialDescription,
  eventDate: initialEventDate,
  budgetMin: initialBudgetMin,
  budgetMax: initialBudgetMax,
  revealGivers: initialRevealGivers,
  allowMemberWishlists: initialAllowMemberWishlists,
  isOwner,
}: BubbleSettingsFormProps) {
  const t = useTranslations("bubbles.settings");
  const tCreate = useTranslations("bubbles.create");
  const tToast = useTranslations("toasts");
  const router = useRouter();

  // Form state
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription || "");
  const [eventDate, setEventDate] = useState<Date | undefined>(
    initialEventDate ? new Date(initialEventDate) : undefined
  );
  const [budgetMin, setBudgetMin] = useState(initialBudgetMin?.toString() || "");
  const [budgetMax, setBudgetMax] = useState(initialBudgetMax?.toString() || "");
  const [revealGivers, setRevealGivers] = useState(initialRevealGivers);
  const [allowMemberWishlists, setAllowMemberWishlists] = useState(initialAllowMemberWishlists);

  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingToggle, setIsUpdatingToggle] = useState<string | null>(null);

  // Check if form has changes
  const hasChanges =
    name !== initialName ||
    description !== (initialDescription || "") ||
    eventDate?.toISOString() !== (initialEventDate ? new Date(initialEventDate).toISOString() : undefined) ||
    budgetMin !== (initialBudgetMin?.toString() || "") ||
    budgetMax !== (initialBudgetMax?.toString() || "");

  const handleSaveDetails = async () => {
    if (!name.trim()) {
      toast.error(tCreate("validation.nameRequired"));
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/bubbles/${bubbleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          eventDate: eventDate?.toISOString() || null,
          budgetMin: budgetMin ? parseFloat(budgetMin) : null,
          budgetMax: budgetMax ? parseFloat(budgetMax) : null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save");
      }

      toast.success(tToast("success.settingsSaved"));
      router.refresh();
    } catch {
      toast.error(tToast("error.settingsSaveFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (field: "revealGivers" | "allowMemberWishlists", checked: boolean) => {
    setIsUpdatingToggle(field);

    // Optimistic update
    if (field === "revealGivers") {
      setRevealGivers(checked);
    } else {
      setAllowMemberWishlists(checked);
    }

    try {
      const response = await fetch(`/api/bubbles/${bubbleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: checked }),
      });

      if (!response.ok) {
        throw new Error("Failed to update setting");
      }

      toast.success(tToast("success.settingsSaved"));
      router.refresh();
    } catch {
      // Revert on error
      if (field === "revealGivers") {
        setRevealGivers(!checked);
      } else {
        setAllowMemberWishlists(!checked);
      }
      toast.error(tToast("error.settingsSaveFailed"));
    } finally {
      setIsUpdatingToggle(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Details - Only owners can edit */}
      {isOwner && (
        <div className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">{tCreate("name")}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={tCreate("namePlaceholder")}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">{tCreate("description")}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={tCreate("descriptionPlaceholder")}
              rows={3}
            />
          </div>

          {/* Event Date */}
          <div className="space-y-2">
            <Label>{tCreate("eventDate")}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !eventDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {eventDate ? format(eventDate, "PPP") : t("noDateSet")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={eventDate}
                  onSelect={setEventDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Budget Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budgetMin">{tCreate("budgetMin")}</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                <Input
                  id="budgetMin"
                  type="number"
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(e.target.value)}
                  className="pl-7"
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="budgetMax">{tCreate("budgetMax")}</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                <Input
                  id="budgetMax"
                  type="number"
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value)}
                  className="pl-7"
                  placeholder="50"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          {hasChanges && (
            <Button onClick={handleSaveDetails} disabled={isSaving} className="w-full">
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("saveChanges")}
            </Button>
          )}
        </div>
      )}

      {/* Divider if owner */}
      {isOwner && <hr className="border-border" />}

      {/* Toggle Settings */}
      <div className="space-y-4">
        {/* Reveal Givers Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="reveal-givers" className="text-base">
              {t("revealGivers.label")}
            </Label>
            <p className="text-sm text-muted-foreground">
              {t("revealGivers.description")}
            </p>
          </div>
          <Switch
            id="reveal-givers"
            checked={revealGivers}
            onCheckedChange={(checked) => handleToggle("revealGivers", checked)}
            disabled={isUpdatingToggle !== null}
          />
        </div>

        {/* Allow Member Wishlists Toggle (Registry Mode) - Only owners can toggle */}
        {isOwner && (
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="allow-member-wishlists" className="text-base">
                {t("allowMemberWishlists.label")}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t("allowMemberWishlists.description")}
              </p>
            </div>
            <Switch
              id="allow-member-wishlists"
              checked={allowMemberWishlists}
              onCheckedChange={(checked) => handleToggle("allowMemberWishlists", checked)}
              disabled={isUpdatingToggle !== null}
            />
          </div>
        )}
      </div>
    </div>
  );
}
