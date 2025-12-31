"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
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
import {
  Plus,
  Gift,
  Loader2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { type AddItemInput } from "@/lib/validators/wishlist";
import { AddItemForm } from "@/components/wishlist/add-item-form";
import { SortableItem } from "@/components/wishlist/sortable-item";

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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
  }, [session, tToasts]);

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

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id || !wishlist) {
        return;
      }

      const oldIndex = wishlist.items.findIndex((item) => item.id === active.id);
      const newIndex = wishlist.items.findIndex((item) => item.id === over.id);

      if (oldIndex === -1 || newIndex === -1) {
        return;
      }

      // Optimistically update the UI
      const newItems = arrayMove(wishlist.items, oldIndex, newIndex);
      setWishlist((prev) => (prev ? { ...prev, items: newItems } : null));

      // Send the reorder request
      try {
        const reorderData = newItems.map((item, index) => ({
          id: item.id,
          sortOrder: index,
        }));

        const response = await fetch("/api/wishlist", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: reorderData }),
        });

        if (!response.ok) {
          throw new Error("Failed to save order");
        }
      } catch (error) {
        // Revert on error
        setWishlist((prev) =>
          prev ? { ...prev, items: wishlist.items } : null
        );
        toast.error(tToasts("error.reorderFailed"));
        console.error("Reorder failed:", error);
      }
    },
    [wishlist, tToasts]
  );

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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={wishlist.items.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {wishlist.items.map((item) => (
                  <SortableItem
                    key={item.id}
                    item={item}
                    onDelete={handleDelete}
                    isDeleting={deletingId === item.id}
                    t={(key, values) => t(key, values as Record<string, string | number | Date> | undefined)}
                    tPriority={(key) => tPriority(key as "MUST_HAVE" | "NICE_TO_HAVE" | "DREAM")}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* Drag hint for desktop */}
        {wishlist && wishlist.items.length > 1 && (
          <p className="text-center text-sm text-muted-foreground mt-6 hidden sm:block">
            {t("dragHint")}
          </p>
        )}
      </div>
    </div>
  );
}
