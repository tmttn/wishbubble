"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Gift,
  Loader2,
  ExternalLink,
  Trash2,
  Sparkles,
  Star,
  Heart,
} from "lucide-react";
import { toast } from "sonner";
import { type AddItemInput } from "@/lib/validators/wishlist";
import { AddItemForm } from "@/components/wishlist/add-item-form";

interface WishlistItem {
  id: string;
  title: string;
  description: string | null;
  price: string | null;
  priceMax: string | null;
  currency: string;
  url: string | null;
  imageUrl: string | null;
  priority: string;
  quantity: number;
  notes: string | null;
  category: string | null;
}

interface Wishlist {
  id: string;
  name: string;
  items: WishlistItem[];
}

export default function WishlistPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslations("wishlist");
  const tPriority = useTranslations("wishlist.priority");
  const tToasts = useTranslations("toasts");
  const tConfirmations = useTranslations("confirmations");

  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const response = await fetch("/api/wishlist");
        if (response.ok) {
          const data = await response.json();
          setWishlist(data);
        }
      } catch (error) {
        console.error("Failed to fetch wishlist:", error);
        toast.error(tToasts("error.wishlistLoadFailed"));
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user) {
      fetchWishlist();
    }
  }, [session]);

  const handleAddItem = async (data: AddItemInput) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add item");
      }

      const newItem = await response.json();
      setWishlist((prev) =>
        prev ? { ...prev, items: [...prev.items, newItem] } : null
      );
      toast.success(tToasts("success.itemAdded"));
      setIsDialogOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : tToasts("error.addItemFailed")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm(tConfirmations("deleteItem"))) return;

    setDeletingId(itemId);
    try {
      const response = await fetch(`/api/wishlist?itemId=${itemId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || tToasts("error.deleteItemFailed"));
      }

      setWishlist((prev) =>
        prev
          ? { ...prev, items: prev.items.filter((item) => item.id !== itemId) }
          : null
      );
      toast.success(tToasts("success.itemDeleted"));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : tToasts("error.deleteItemFailed")
      );
    } finally {
      setDeletingId(null);
    }
  };

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case "MUST_HAVE":
        return {
          variant: "destructive" as const,
          icon: Star,
          gradient: "from-red-500 to-rose-500",
        };
      case "DREAM":
        return {
          variant: "secondary" as const,
          icon: Sparkles,
          gradient: "from-purple-500 to-pink-500",
        };
      default:
        return {
          variant: "outline" as const,
          icon: Heart,
          gradient: "from-pink-500 to-rose-500",
        };
    }
  };

  const formatPrice = (price: string | null, priceMax: string | null, currency: string) => {
    if (!price && !priceMax) return null;

    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "EUR",
    });

    const p = parseFloat(price || "0");
    const pMax = parseFloat(priceMax || "0");

    if (p && pMax && p !== pMax) {
      return `${formatter.format(p)} - ${formatter.format(pMax)}`;
    }
    return formatter.format(p || pMax);
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-mesh flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-full bg-gradient-to-br from-primary/20 to-accent/20 p-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <p className="text-muted-foreground">Loading your wishlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-mesh">
      <div className="container px-4 sm:px-6 py-6 md:py-10 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8 md:mb-10">
          <div className="animate-slide-up">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">
              {t("title")}
            </h1>
            <p className="text-muted-foreground mt-1 sm:mt-2">
              {t("subtitle")}
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="group rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/20 w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                {t("addItem")}
                <Sparkles className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl">{t("addItem")}</DialogTitle>
                <DialogDescription>
                  {t("addItemDescription")}
                </DialogDescription>
              </DialogHeader>
              <AddItemForm
                onSubmit={handleAddItem}
                onCancel={() => setIsDialogOpen(false)}
                isSubmitting={isSubmitting}
              />
            </DialogContent>
          </Dialog>
        </div>

        {!wishlist || wishlist.items.length === 0 ? (
          <Card className="border-dashed border-2 bg-card/50 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-16 md:py-20 px-4">
              <div className="rounded-full bg-gradient-to-br from-primary/20 to-accent/20 p-5 mb-6">
                <Gift className="h-12 w-12 md:h-14 md:w-14 text-primary" />
              </div>
              <h3 className="text-xl md:text-2xl font-semibold mb-3 text-center">{t("empty")}</h3>
              <p className="text-muted-foreground text-center mb-8 max-w-md">{t("addFirst")}</p>
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/20"
                size="lg"
              >
                <Plus className="mr-2 h-5 w-5" />
                {t("addItem")}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {wishlist.items.map((item, index) => {
              const priorityConfig = getPriorityConfig(item.priority);
              const PriorityIcon = priorityConfig.icon;

              return (
                <Card
                  key={item.id}
                  className="group border-0 bg-card/80 backdrop-blur-sm card-hover overflow-hidden"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {/* Priority indicator bar */}
                  <div className={`h-1 bg-gradient-to-r ${priorityConfig.gradient}`} />

                  <CardContent className="p-4 sm:p-6">
                    <div className="flex gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Title and priority row */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                            {item.title}
                          </h3>
                          <Badge
                            variant={priorityConfig.variant}
                            className="self-start shrink-0 flex items-center gap-1"
                          >
                            <PriorityIcon className="h-3 w-3" />
                            {tPriority(item.priority as "MUST_HAVE" | "NICE_TO_HAVE" | "DREAM")}
                          </Badge>
                        </div>

                        {/* Description */}
                        {item.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {item.description}
                          </p>
                        )}

                        {/* Price, quantity, link row */}
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          {formatPrice(item.price, item.priceMax, item.currency) && (
                            <span className="font-semibold text-base bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                              {formatPrice(item.price, item.priceMax, item.currency)}
                            </span>
                          )}
                          {item.quantity > 1 && (
                            <span className="text-muted-foreground px-2 py-0.5 bg-muted rounded-full text-xs">
                              {t("quantity", { count: item.quantity })}
                            </span>
                          )}
                          {item.url && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:text-primary/80 inline-flex items-center gap-1 hover:underline"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              {t("view")}
                            </a>
                          )}
                        </div>

                        {/* Notes */}
                        {item.notes && (
                          <p className="mt-3 text-sm text-muted-foreground italic bg-muted/50 px-3 py-2 rounded-lg">
                            {t("note", { note: item.notes })}
                          </p>
                        )}
                      </div>

                      {/* Delete button */}
                      <div className="shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                        >
                          {deletingId === item.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
