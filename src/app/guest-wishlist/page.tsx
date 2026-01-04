"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Gift, UserPlus, LogIn, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGuestWishlist } from "@/lib/guest-wishlist";
import { GuestAddItemForm } from "@/components/guest/guest-add-item-form";
import { GuestWishlistItem } from "@/components/guest/guest-wishlist-item";
import { ExpirationWarning } from "@/components/guest/expiration-warning";

export default function GuestWishlistPage() {
  const t = useTranslations("guest.wishlist");
  const router = useRouter();
  const { data: session, status } = useSession();
  const {
    wishlist,
    isLoading,
    addItem,
    removeItem,
    createNew,
    daysRemaining,
    itemCount,
  } = useGuestWishlist();

  // Redirect authenticated users to their wishlist
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/wishlist");
    }
  }, [status, router]);

  // Create wishlist if none exists
  useEffect(() => {
    if (!isLoading && !wishlist && status === "unauthenticated") {
      createNew();
    }
  }, [isLoading, wishlist, createNew, status]);

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (status === "authenticated") {
    return null; // Will redirect
  }

  return (
    <div className="container py-8 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Gift className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">{t("title")}</h1>
        </div>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Expiration Warning */}
      {wishlist && (
        <div className="mb-6">
          <ExpirationWarning daysRemaining={daysRemaining} />
        </div>
      )}

      {/* Not Saved Notice */}
      <Card className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">
                {t("notSaved")}
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                {t("signUpToSave")}
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" asChild>
                <Link href="/register">
                  <UserPlus className="h-4 w-4 mr-2" />
                  {t("register")}
                </Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link href="/login">
                  <LogIn className="h-4 w-4 mr-2" />
                  {t("login")}
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Item Button */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-sm text-muted-foreground">
          {t("itemsCount", { count: itemCount })}
        </p>
        <GuestAddItemForm onAddItem={addItem} />
      </div>

      {/* Items List */}
      {itemCount === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t("empty")}</h3>
            <p className="text-muted-foreground mb-4">{t("emptyDescription")}</p>
            <GuestAddItemForm onAddItem={addItem} />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {wishlist?.items.map((item) => (
            <GuestWishlistItem
              key={item.id}
              item={item}
              onRemove={removeItem}
            />
          ))}
        </div>
      )}

      {/* Bottom CTA */}
      {itemCount > 0 && (
        <Card className="mt-8 bg-primary/5 border-primary/20">
          <CardContent className="py-6 text-center">
            <h3 className="text-lg font-semibold mb-2">{t("saveCta.title")}</h3>
            <p className="text-muted-foreground mb-4">
              {t("saveCta.description")}
            </p>
            <div className="flex justify-center gap-2">
              <Button asChild>
                <Link href="/register">
                  <UserPlus className="h-4 w-4 mr-2" />
                  {t("saveCta.register")}
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/login">{t("saveCta.login")}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
