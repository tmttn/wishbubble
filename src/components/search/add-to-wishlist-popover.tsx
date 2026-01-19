"use client";

import { useState, useEffect } from "react";
import { useTypedTranslations } from "@/i18n/useTypedTranslations";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useMediaQuery } from "@/hooks/use-media-query";
import Link from "next/link";
import type { SearchProductData } from "./search-product-card";

interface Wishlist {
  id: string;
  name: string;
  isDefault: boolean;
}

interface AddToWishlistPopoverProps {
  product: SearchProductData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anchorRef?: React.RefObject<HTMLElement>;
}

export function AddToWishlistPopover({
  product,
  open,
  onOpenChange,
}: AddToWishlistPopoverProps) {
  const t = useTypedTranslations("search.addToWishlist");
  const tToasts = useTypedTranslations("toasts");
  const isMobile = useMediaQuery("(max-width: 640px)");

  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState<string | null>(null);

  // Fetch wishlists when opened
  useEffect(() => {
    if (open && wishlists.length === 0) {
      setIsLoading(true);
      fetch("/api/wishlists")
        .then((res) => res.json())
        .then((data) => {
          if (data.wishlists && Array.isArray(data.wishlists)) {
            setWishlists(data.wishlists);
          }
        })
        .catch(() => {
          toast.error(tToasts("error.generic"));
        })
        .finally(() => setIsLoading(false));
    }
  }, [open, wishlists.length, tToasts]);

  // Validate URL - ensure it's a valid URL or empty string
  const sanitizeUrl = (url: string | undefined): string => {
    if (!url) return "";
    try {
      // Check if it's a valid URL
      new URL(url);
      return url;
    } catch {
      // If invalid, return empty string to pass validation
      return "";
    }
  };

  const handleAddToWishlist = async (
    wishlistId: string,
    wishlistName: string
  ) => {
    if (!product) return;

    setIsAdding(wishlistId);
    try {
      const response = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wishlistId,
          title: product.title?.substring(0, 200) || "Untitled",
          description: (product.description || "").substring(0, 1000),
          price: product.price,
          currency: product.currency || "EUR",
          url: sanitizeUrl(product.url),
          imageUrl: sanitizeUrl(product.imageUrl),
          priority: "NICE_TO_HAVE",
          quantity: 1,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add item");
      }

      toast.success(t("success", { wishlist: wishlistName }));
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : tToasts("error.generic")
      );
    } finally {
      setIsAdding(null);
    }
  };

  const Content = () => (
    <div className="space-y-2">
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : wishlists.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground mb-3">
            {t("noWishlists")}
          </p>
          <Button asChild size="sm">
            <Link href="/wishlist">
              <Plus className="h-4 w-4 mr-2" />
              {t("createWishlist")}
            </Link>
          </Button>
        </div>
      ) : (
        wishlists.map((wishlist) => (
          <button
            key={wishlist.id}
            onClick={() => handleAddToWishlist(wishlist.id, wishlist.name)}
            disabled={isAdding !== null}
            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors text-left disabled:opacity-50"
          >
            <span className="font-medium">{wishlist.name}</span>
            {isAdding === wishlist.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        ))
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" showDragHandle>
          <SheetHeader>
            <SheetTitle>{t("selectWishlist")}</SheetTitle>
          </SheetHeader>
          <div className="py-4">
            <Content />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[320px]">
        <DialogHeader>
          <DialogTitle>{t("selectWishlist")}</DialogTitle>
        </DialogHeader>
        <Content />
      </DialogContent>
    </Dialog>
  );
}
