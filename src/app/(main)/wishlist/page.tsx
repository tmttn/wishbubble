"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Gift,
  Loader2,
  ExternalLink,
  Trash2,
  Edit,
} from "lucide-react";
import { toast } from "sonner";
import {
  addItemSchema,
  type AddItemInput,
} from "@/lib/validators/wishlist";

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

  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AddItemInput>({
    resolver: zodResolver(addItemSchema),
    defaultValues: {
      priority: "NICE_TO_HAVE",
      quantity: 1,
      currency: "EUR",
    },
  });

  const priority = watch("priority");

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
        toast.error("Failed to load wishlist");
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user) {
      fetchWishlist();
    }
  }, [session]);

  const onSubmit = async (data: AddItemInput) => {
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
      toast.success("Item added!");
      setIsDialogOpen(false);
      reset();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add item"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    setDeletingId(itemId);
    try {
      const response = await fetch(`/api/wishlist?itemId=${itemId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete item");
      }

      setWishlist((prev) =>
        prev
          ? { ...prev, items: prev.items.filter((item) => item.id !== itemId) }
          : null
      );
      toast.success("Item deleted");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete item"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "MUST_HAVE":
        return "destructive";
      case "DREAM":
        return "secondary";
      default:
        return "outline";
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
      <div className="container py-8 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground mt-1">
            Manage your wishlist items
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t("addItem")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{t("addItem")}</DialogTitle>
              <DialogDescription>
                Add a new item to your wishlist
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">{t("item.title")} *</Label>
                <Input
                  id="title"
                  placeholder={t("item.titlePlaceholder")}
                  {...register("title")}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t("item.description")}</Label>
                <Textarea
                  id="description"
                  placeholder={t("item.descriptionPlaceholder")}
                  {...register("description")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">{t("item.url")}</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder={t("item.urlPlaceholder")}
                  {...register("url")}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">{t("item.price")}</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      &euro;
                    </span>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      className="pl-8"
                      {...register("price")}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">{t("item.quantity")}</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    {...register("quantity")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("item.priority")}</Label>
                <Select
                  value={priority}
                  onValueChange={(value) =>
                    setValue("priority", value as "MUST_HAVE" | "NICE_TO_HAVE" | "DREAM")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MUST_HAVE">
                      {tPriority("MUST_HAVE")}
                    </SelectItem>
                    <SelectItem value="NICE_TO_HAVE">
                      {tPriority("NICE_TO_HAVE")}
                    </SelectItem>
                    <SelectItem value="DREAM">{tPriority("DREAM")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">{t("item.notes")}</Label>
                <Textarea
                  id="notes"
                  placeholder={t("item.notesPlaceholder")}
                  {...register("notes")}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Add Item
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!wishlist || wishlist.items.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t("empty")}</h3>
            <p className="text-muted-foreground mb-4">{t("addFirst")}</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("addItem")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {wishlist.items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-medium">{item.title}</h3>
                        {item.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <Badge variant={getPriorityColor(item.priority) as "destructive" | "secondary" | "outline"}>
                        {tPriority(item.priority as "MUST_HAVE" | "NICE_TO_HAVE" | "DREAM")}
                      </Badge>
                    </div>

                    <div className="mt-2 flex items-center gap-3 text-sm">
                      {formatPrice(item.price, item.priceMax, item.currency) && (
                        <span className="font-medium">
                          {formatPrice(item.price, item.priceMax, item.currency)}
                        </span>
                      )}
                      {item.quantity > 1 && (
                        <span className="text-muted-foreground">
                          Qty: {item.quantity}
                        </span>
                      )}
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View
                        </a>
                      )}
                    </div>

                    {item.notes && (
                      <p className="mt-2 text-sm text-muted-foreground italic">
                        Note: {item.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                    >
                      {deletingId === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
