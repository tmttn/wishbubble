"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { GuestWishlistItem } from "@/lib/guest-wishlist/types";

interface GuestAddItemFormProps {
  onAddItem: (item: Omit<GuestWishlistItem, "id" | "createdAt">) => void;
}

export function GuestAddItemForm({ onAddItem }: GuestAddItemFormProps) {
  const t = useTranslations("guest.wishlist");
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [url, setUrl] = useState("");
  const [priority, setPriority] = useState<"MUST_HAVE" | "NICE_TO_HAVE" | "DREAM">("NICE_TO_HAVE");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error(t("titleRequired"));
      return;
    }

    setIsLoading(true);

    try {
      // If URL provided, try to scrape for image
      let imageUrl: string | undefined;
      if (url) {
        try {
          const response = await fetch("/api/products/scrape", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url }),
          });
          if (response.ok) {
            const data = await response.json();
            imageUrl = data.product?.imageUrl;
          }
        } catch {
          // Ignore scraping errors
        }
      }

      onAddItem({
        title: title.trim(),
        description: description.trim() || undefined,
        price: price ? parseFloat(price) : undefined,
        currency: "EUR",
        url: url.trim() || undefined,
        imageUrl,
        priority,
        quantity: 1,
      });

      // Reset form
      setTitle("");
      setDescription("");
      setPrice("");
      setUrl("");
      setPriority("NICE_TO_HAVE");
      setOpen(false);

      toast.success(t("itemAdded"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          {t("addItem")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("addItemTitle")}</DialogTitle>
          <DialogDescription>{t("addItemDescription")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t("form.title")} *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("form.titlePlaceholder")}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t("form.description")}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("form.descriptionPlaceholder")}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">{t("form.price")}</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">{t("form.priority")}</Label>
              <Select
                value={priority}
                onValueChange={(value) =>
                  setPriority(value as "MUST_HAVE" | "NICE_TO_HAVE" | "DREAM")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MUST_HAVE">{t("form.mustHave")}</SelectItem>
                  <SelectItem value="NICE_TO_HAVE">{t("form.niceToHave")}</SelectItem>
                  <SelectItem value="DREAM">{t("form.dream")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">{t("form.url")}</Label>
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t("form.add")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
