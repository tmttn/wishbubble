"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PartyPopper, Gift, Check, Package, ListTodo, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface GiftSummaryItem {
  id: string;
  title: string;
  price: number | null;
  currency: string;
  url: string | null;
  status: "CLAIMED" | "PURCHASED";
  claimedBy: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  } | null;
  recipient: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
  };
}

interface GiftSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  bubbleName: string;
  eventDate: Date;
  gifts: GiftSummaryItem[];
  currentUserId: string;
}

export function GiftSummaryModal({
  isOpen,
  onClose,
  bubbleName,
  eventDate: _eventDate,
  gifts,
  currentUserId,
}: GiftSummaryModalProps) {
  const t = useTranslations("bubbles.giftSummary");
  const router = useRouter();
  const [hasShownConfetti, setHasShownConfetti] = useState(false);

  const fireConfetti = useCallback(() => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"],
      });
    }, 250);
  }, []);

  useEffect(() => {
    if (isOpen && !hasShownConfetti) {
      // Small delay for modal to render
      const timer = setTimeout(() => {
        fireConfetti();
        setHasShownConfetti(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, hasShownConfetti, fireConfetti]);

  // formatDate and formatPrice available for future use

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Group gifts by recipient
  const giftsByRecipient = gifts.reduce((acc, gift) => {
    const recipientId = gift.recipient.id;
    if (!acc[recipientId]) {
      acc[recipientId] = {
        recipient: gift.recipient,
        gifts: [],
      };
    }
    acc[recipientId].gifts.push(gift);
    return acc;
  }, {} as Record<string, { recipient: GiftSummaryItem["recipient"]; gifts: GiftSummaryItem[] }>);

  const totalGifts = gifts.length;
  const purchasedGifts = gifts.filter((g) => g.status === "PURCHASED").length;
  const myGifts = gifts.filter((g) => g.claimedBy?.id === currentUserId);
  const giftsReceived = gifts.filter((g) => g.recipient.id === currentUserId);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="text-center shrink-0">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground">
            <PartyPopper className="h-8 w-8" />
          </div>
          <DialogTitle className="text-2xl">{t("title")}</DialogTitle>
          <DialogDescription className="text-base">
            {t("subtitle", { bubbleName })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 text-center shrink-0">
            <div className="rounded-lg bg-muted/50 p-3">
              <div className="text-2xl font-bold text-primary">{totalGifts}</div>
              <div className="text-xs text-muted-foreground">{t("totalGifts")}</div>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <div className="text-2xl font-bold text-accent">{purchasedGifts}</div>
              <div className="text-xs text-muted-foreground">{t("purchased")}</div>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <div className="text-2xl font-bold text-blue-600">{myGifts.length}</div>
              <div className="text-xs text-muted-foreground">{t("yourGifts")}</div>
            </div>
          </div>

          {/* My gifts section */}
          {myGifts.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                {t("giftsYouGave")}
              </h4>
              <div className="space-y-2">
                {myGifts.map((gift) => (
                  <div
                    key={gift.id}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <Gift className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{gift.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {t("giftFor", { name: gift.recipient.name || "Someone" })}
                      </p>
                    </div>
                    <Badge
                      variant={gift.status === "PURCHASED" ? "default" : "secondary"}
                      className={cn(
                        "shrink-0",
                        gift.status === "PURCHASED" && "bg-accent text-accent-foreground"
                      )}
                    >
                      {gift.status === "PURCHASED" ? (
                        <>
                          <Check className="mr-1 h-3 w-3" />
                          {t("bought")}
                        </>
                      ) : (
                        <>
                          <Package className="mr-1 h-3 w-3" />
                          {t("claimed")}
                        </>
                      )}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gifts received section */}
          {giftsReceived.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                {t("giftsYouReceived")}
              </h4>
              <div className="space-y-2">
                {giftsReceived.map((gift) => (
                  <div
                    key={gift.id}
                    className="flex items-center gap-3 rounded-lg border border-pink-200 dark:border-pink-900 bg-pink-50/50 dark:bg-pink-950/20 p-3"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-100 dark:bg-pink-900/30">
                      <Heart className="h-4 w-4 text-pink-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{gift.title}</p>
                      {gift.claimedBy && (
                        <p className="text-xs text-muted-foreground">
                          {t("giftFrom", { name: gift.claimedBy.name || "Someone" })}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={gift.status === "PURCHASED" ? "default" : "secondary"}
                      className={cn(
                        "shrink-0",
                        gift.status === "PURCHASED" && "bg-accent text-accent-foreground"
                      )}
                    >
                      {gift.status === "PURCHASED" ? (
                        <>
                          <Check className="mr-1 h-3 w-3" />
                          {t("bought")}
                        </>
                      ) : (
                        <>
                          <Package className="mr-1 h-3 w-3" />
                          {t("claimed")}
                        </>
                      )}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All recipients summary */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              {t("giftRecipients")}
            </h4>
            <div className="flex flex-wrap gap-2">
              {Object.values(giftsByRecipient).map(({ recipient, gifts: recipientGifts }) => (
                <div
                  key={recipient.id}
                  className="flex items-center gap-2 rounded-full bg-muted/50 pl-1 pr-3 py-1"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={recipient.avatarUrl || undefined} />
                    <AvatarFallback className="text-[10px]">
                      {getInitials(recipient.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{recipient.name}</span>
                  <Badge variant="outline" className="text-[10px] h-5">
                    {recipientGifts.length} {recipientGifts.length === 1 ? t("gift") : t("giftsPlural")}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2 shrink-0">
          <Button
            variant="outline"
            onClick={() => {
              onClose();
              router.push("/wishlist");
            }}
            className="gap-2"
          >
            <ListTodo className="h-4 w-4" />
            {t("viewWishlist")}
          </Button>
          <Button onClick={onClose} className="px-8">
            {t("celebrate")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
