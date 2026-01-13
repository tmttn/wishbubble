"use client";

import * as Sentry from "@sentry/nextjs";
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
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@/components/ui/responsive-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  Gift,
  Loader2,
  Sparkles,
  ChevronDown,
  Star,
  Pencil,
  Trash2,
  Crown,
  ListPlus,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { type AddItemInput } from "@/lib/validators/wishlist";
import { AddItemForm } from "@/components/wishlist/add-item-form";
import { SortableItem } from "@/components/wishlist/sortable-item";
import {
  ConfirmationDialog,
  useConfirmation,
} from "@/components/ui/confirmation-dialog";

interface WishlistItem {
  id: string;
  title: string;
  description: string | null;
  price: string | null;
  priceMax: string | null;
  currency: string;
  url: string | null;
  imageUrl: string | null;
  uploadedImage: string | null;
  priority: string;
  quantity: number;
  notes: string | null;
  category: string | null;
}

interface Wishlist {
  id: string;
  name: string;
  isDefault: boolean;
  items: WishlistItem[];
  _count?: { items: number };
}

interface WishlistsResponse {
  wishlists: Wishlist[];
  limits: {
    current: number;
    max: number;
    canCreate: boolean;
    upgradeRequired: boolean;
  };
  itemLimits: {
    max: number;
    isUnlimited: boolean;
  };
  tier: string;
}

export default function WishlistPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslations("wishlist");
  const tPriority = useTranslations("wishlist.priority");
  const tToasts = useTranslations("toasts");
  const tConfirmations = useTranslations("confirmations");

  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [limits, setLimits] = useState<WishlistsResponse["limits"] | null>(null);
  const [itemLimits, setItemLimits] = useState<WishlistsResponse["itemLimits"] | null>(null);
  const [tier, setTier] = useState<string | null>(null);
  const [currentWishlist, setCurrentWishlist] = useState<Wishlist | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newWishlistName, setNewWishlistName] = useState("");
  const [renameName, setRenameName] = useState("");
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);

  const { confirm, dialogProps } = useConfirmation();

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

  // Fetch all wishlists
  const fetchWishlists = useCallback(async () => {
    try {
      const response = await fetch("/api/wishlists");
      if (response.ok) {
        const data: WishlistsResponse = await response.json();
        setWishlists(data.wishlists);
        setLimits(data.limits);
        setItemLimits(data.itemLimits);
        setTier(data.tier);

        // Select current wishlist (default or first)
        if (!currentWishlist && data.wishlists.length > 0) {
          const defaultWishlist =
            data.wishlists.find((w) => w.isDefault) || data.wishlists[0];
          await fetchWishlistItems(defaultWishlist.id);
        }
      }
    } catch (error) {
      Sentry.captureException(error, { tags: { component: "WishlistPage", action: "fetchWishlists" } });
      toast.error(tToasts("error.wishlistLoadFailed"));
    } finally {
      setIsLoading(false);
    }
  }, [currentWishlist, tToasts]);

  // Fetch items for a specific wishlist
  const fetchWishlistItems = async (wishlistId: string) => {
    try {
      const response = await fetch(`/api/wishlists/${wishlistId}`);
      if (response.ok) {
        const data = await response.json();
        setCurrentWishlist(data);
      }
    } catch (error) {
      Sentry.captureException(error, { tags: { component: "WishlistPage", action: "fetchWishlistItems" } });
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchWishlists();
    }
  }, [session, fetchWishlists]);

  const handleSwitchWishlist = async (wishlist: Wishlist) => {
    await fetchWishlistItems(wishlist.id);
  };

  const handleCreateWishlist = async () => {
    if (!newWishlistName.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/wishlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newWishlistName.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.upgradeRequired) {
          toast.error(t("limits.wishlistLimitReached"));
          return;
        }
        throw new Error(error.error);
      }

      const newWishlist = await response.json();
      setWishlists((prev) => [...prev, newWishlist]);
      setLimits((prev) =>
        prev ? { ...prev, current: prev.current + 1 } : null
      );
      await fetchWishlistItems(newWishlist.id);
      setIsCreateDialogOpen(false);
      setNewWishlistName("");
      toast.success(t("success.wishlistCreated"));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : tToasts("error.generic")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRenameWishlist = async () => {
    if (!renameName.trim() || !currentWishlist) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/wishlists/${currentWishlist.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: renameName.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to rename wishlist");
      }

      const updated = await response.json();
      setCurrentWishlist((prev) =>
        prev ? { ...prev, name: updated.name } : null
      );
      setWishlists((prev) =>
        prev.map((w) => (w.id === updated.id ? { ...w, name: updated.name } : w))
      );
      setIsRenameDialogOpen(false);
      setRenameName("");
      toast.success(t("success.wishlistRenamed"));
    } catch {
      toast.error(tToasts("error.generic"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetDefault = async (wishlistId: string) => {
    try {
      const response = await fetch(`/api/wishlists/${wishlistId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });

      if (!response.ok) {
        throw new Error("Failed to set default wishlist");
      }

      setWishlists((prev) =>
        prev.map((w) => ({ ...w, isDefault: w.id === wishlistId }))
      );
      if (currentWishlist?.id === wishlistId) {
        setCurrentWishlist((prev) => (prev ? { ...prev, isDefault: true } : null));
      }
      toast.success(t("success.defaultSet"));
    } catch {
      toast.error(tToasts("error.generic"));
    }
  };

  const handleDeleteWishlist = async (wishlistId: string) => {
    const deleteWishlist = async () => {
      try {
        const response = await fetch(`/api/wishlists/${wishlistId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error);
        }

        const remaining = wishlists.filter((w) => w.id !== wishlistId);
        setWishlists(remaining);
        setLimits((prev) =>
          prev ? { ...prev, current: prev.current - 1 } : null
        );

        if (currentWishlist?.id === wishlistId) {
          const defaultWishlist =
            remaining.find((w) => w.isDefault) || remaining[0];
          if (defaultWishlist) {
            await fetchWishlistItems(defaultWishlist.id);
          } else {
            setCurrentWishlist(null);
          }
        }

        toast.success(t("success.wishlistDeleted"));
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : tToasts("error.generic")
        );
      }
    };

    confirm({
      title: tConfirmations("deleteWishlistTitle"),
      description: tConfirmations("deleteWishlist"),
      confirmText: tConfirmations("delete"),
      cancelText: tConfirmations("cancel"),
      variant: "destructive",
      onConfirm: deleteWishlist,
    });
  };

  const handleAddItem = useCallback(async (data: AddItemInput) => {
    if (!currentWishlist) {
      toast.error(tToasts("error.noWishlistSelected"));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, wishlistId: currentWishlist.id }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.upgradeRequired) {
          toast.error(t("limits.itemLimitReached"));
          return;
        }
        throw new Error(error.error || "Failed to add item");
      }

      const newItem = await response.json();
      setCurrentWishlist((prev) =>
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
  }, [currentWishlist, t, tToasts]);

  const handleEditItem = (item: WishlistItem) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const handleUpdateItem = useCallback(async (data: AddItemInput) => {
    if (!editingItem) {
      toast.error(tToasts("error.generic"));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/wishlist?itemId=${editingItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update item");
      }

      const updatedItem = await response.json();
      setCurrentWishlist((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((item) =>
                item.id === editingItem.id ? updatedItem : item
              ),
            }
          : null
      );
      toast.success(tToasts("success.itemUpdated"));
      setIsDialogOpen(false);
      setEditingItem(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : tToasts("error.updateItemFailed")
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [editingItem, tToasts]);

  const handleDelete = (itemId: string) => {
    const deleteItem = async () => {
      setDeletingId(itemId);
      try {
        const response = await fetch(`/api/wishlist?itemId=${itemId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || tToasts("error.deleteItemFailed"));
        }

        setCurrentWishlist((prev) =>
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

    confirm({
      title: tConfirmations("deleteItemTitle"),
      description: tConfirmations("deleteItem"),
      confirmText: tConfirmations("delete"),
      cancelText: tConfirmations("cancel"),
      variant: "destructive",
      onConfirm: deleteItem,
    });
  };

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id || !currentWishlist) {
        return;
      }

      const oldIndex = currentWishlist.items.findIndex(
        (item) => item.id === active.id
      );
      const newIndex = currentWishlist.items.findIndex(
        (item) => item.id === over.id
      );

      if (oldIndex === -1 || newIndex === -1) {
        return;
      }

      const newItems = arrayMove(currentWishlist.items, oldIndex, newIndex);
      setCurrentWishlist((prev) => (prev ? { ...prev, items: newItems } : null));

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
        setCurrentWishlist((prev) =>
          prev ? { ...prev, items: currentWishlist.items } : null
        );
        toast.error(tToasts("error.reorderFailed"));
        Sentry.captureException(error, { tags: { component: "WishlistPage", action: "reorder" } });
      }
    },
    [currentWishlist, tToasts]
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

  const itemCount = currentWishlist?.items.length || 0;
  const itemLimit = itemLimits?.isUnlimited ? null : (itemLimits?.max || 4);
  const canAddItems = itemLimit === null || itemCount < itemLimit;
  const isFreePlan = tier === "BASIC";

  return (
    <div className="min-h-screen bg-gradient-mesh">
      <div className="container px-4 sm:px-6 py-6 md:py-10 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8 md:mb-10">
          <div className="animate-slide-up">
            <div className="flex items-center gap-2 mb-1">
              {/* Wishlist Switcher */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-auto p-0 -ml-3 text-2xl sm:text-3xl md:text-4xl font-bold hover:bg-transparent"
                  >
                    {currentWishlist?.name || t("title")}
                    {currentWishlist?.isDefault && (
                      <Star className="h-4 w-4 ml-2 text-yellow-500 fill-yellow-500" />
                    )}
                    <ChevronDown className="h-5 w-5 ml-1 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  {wishlists.map((wishlist) => (
                    <DropdownMenuItem
                      key={wishlist.id}
                      onClick={() => handleSwitchWishlist(wishlist)}
                      className="flex items-center justify-between"
                    >
                      <span className="flex items-center gap-2">
                        {wishlist.name}
                        {wishlist.isDefault && (
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {wishlist._count?.items || 0} {t("itemsCount")}
                      </span>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  {limits?.canCreate ? (
                    <DropdownMenuItem
                      onClick={() => setIsCreateDialogOpen(true)}
                      className="text-primary"
                    >
                      <ListPlus className="h-4 w-4 mr-2" />
                      {t("createWishlist")}
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem asChild>
                      <Link
                        href="/pricing"
                        className="flex items-center text-amber-600"
                      >
                        <Crown className="h-4 w-4 mr-2" />
                        {t("upgradeForMore")}
                      </Link>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Wishlist actions */}
              {currentWishlist && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem
                      onClick={() => {
                        setRenameName(currentWishlist.name);
                        setIsRenameDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      {t("rename")}
                    </DropdownMenuItem>
                    {!currentWishlist.isDefault && (
                      <>
                        <DropdownMenuItem
                          onClick={() => handleSetDefault(currentWishlist.id)}
                        >
                          <Star className="h-4 w-4 mr-2" />
                          {t("setAsDefault")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteWishlist(currentWishlist.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t("deleteWishlist")}
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            <p className="text-muted-foreground mt-1 sm:mt-2">{t("subtitle")}</p>

            {/* Limits indicator - show for free plan users */}
            {isFreePlan && limits && (
              <div className="mt-3 p-3 rounded-lg bg-muted/50 space-y-3">
                {/* Wishlists limit */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t("wishlistsUsed", {
                        current: limits.current,
                        max: limits.max,
                      })}
                    </span>
                  </div>
                  <Progress
                    value={(limits.current / limits.max) * 100}
                    className="h-1.5"
                  />
                </div>

                {/* Items limit */}
                {itemLimit && currentWishlist && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {t("itemsUsed", { current: itemCount, max: itemLimit })}
                      </span>
                    </div>
                    <Progress value={(itemCount / itemLimit) * 100} className="h-1.5" />
                  </div>
                )}

                {/* Upgrade CTA */}
                <Link
                  href="/pricing"
                  className="flex items-center justify-center gap-2 text-sm text-primary hover:underline pt-1"
                >
                  <Crown className="h-3.5 w-3.5" />
                  {t("upgradeToPremium")}
                </Link>
              </div>
            )}
          </div>

          <ResponsiveDialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditingItem(null);
          }}>
            <ResponsiveDialogTrigger asChild>
              <Button
                className="group rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/20 w-full sm:w-auto"
                disabled={!canAddItems}
              >
                <Plus className="mr-2 h-4 w-4" />
                {t("addItem")}
                <Sparkles className="h-4 w-4 ml-2 transition-colors group-hover:text-yellow-200" />
              </Button>
            </ResponsiveDialogTrigger>
            <ResponsiveDialogContent className="sm:max-w-lg sm:mx-auto">
              <ResponsiveDialogHeader>
                <ResponsiveDialogTitle className="text-xl">
                  {editingItem ? t("editItem") : t("addItem")}
                </ResponsiveDialogTitle>
                <ResponsiveDialogDescription>
                  {editingItem ? t("editItemDescription") : t("addItemDescription")}
                </ResponsiveDialogDescription>
              </ResponsiveDialogHeader>
              <div className="px-4 pb-6 sm:px-0 sm:pb-0">
                <AddItemForm
                  onSubmit={editingItem ? handleUpdateItem : handleAddItem}
                  onCancel={() => {
                    setIsDialogOpen(false);
                    setEditingItem(null);
                  }}
                  isSubmitting={isSubmitting}
                  editItem={editingItem}
                />
              </div>
            </ResponsiveDialogContent>
          </ResponsiveDialog>
        </div>

        {/* Item limit reached banner */}
        {!canAddItems && (
          <Card className="mb-6 border-amber-500/50 bg-amber-500/10">
            <CardContent className="py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="h-5 w-5 text-amber-500" />
                <p className="text-sm">{t("limits.itemLimitReached")}</p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/pricing">{t("upgradeToPremium")}</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {!currentWishlist || currentWishlist.items.length === 0 ? (
          <Card className="border-dashed border-2 bg-card/50 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-16 md:py-20 px-4">
              <div className="rounded-full bg-gradient-to-br from-primary/20 to-accent/20 p-5 mb-6">
                <Gift className="h-12 w-12 md:h-14 md:w-14 text-primary" />
              </div>
              <h3 className="text-xl md:text-2xl font-semibold mb-3 text-center">
                {t("empty")}
              </h3>
              <p className="text-muted-foreground text-center mb-8 max-w-md">
                {t("addFirst")}
              </p>
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/20"
                size="lg"
                disabled={!canAddItems}
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
              items={currentWishlist.items.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {currentWishlist.items.map((item) => (
                  <SortableItem
                    key={item.id}
                    item={item}
                    onEdit={handleEditItem}
                    onDelete={handleDelete}
                    isDeleting={deletingId === item.id}
                    t={(key, values) =>
                      t(
                        key,
                        values as Record<string, string | number | Date> | undefined
                      )
                    }
                    tPriority={(key) =>
                      tPriority(key as "MUST_HAVE" | "NICE_TO_HAVE" | "DREAM")
                    }
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* Drag hint for desktop */}
        {currentWishlist && currentWishlist.items.length > 1 && (
          <p className="text-center text-sm text-muted-foreground mt-6 hidden sm:block">
            {t("dragHint")}
          </p>
        )}
      </div>

      {/* Create Wishlist Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("createWishlist")}</DialogTitle>
            <DialogDescription>{t("createWishlistDescription")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder={t("wishlistNamePlaceholder")}
              value={newWishlistName}
              onChange={(e) => setNewWishlistName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateWishlist()}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setNewWishlistName("");
                }}
              >
                {t("cancel")}
              </Button>
              <Button onClick={handleCreateWishlist} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t("create")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rename Wishlist Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("renameWishlist")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder={t("wishlistNamePlaceholder")}
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRenameWishlist()}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsRenameDialogOpen(false);
                  setRenameName("");
                }}
              >
                {t("cancel")}
              </Button>
              <Button onClick={handleRenameWishlist} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t("save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog {...dialogProps} />
    </div>
  );
}
