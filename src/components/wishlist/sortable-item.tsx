"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ExternalLink,
  Trash2,
  Sparkles,
  Star,
  Heart,
  GripVertical,
  Loader2,
  Pencil,
  Bell,
  BellOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ItemImage } from "@/components/ui/item-image";

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
  priceAlertEnabled?: boolean;
}

interface SortableItemProps {
  item: WishlistItem;
  onEdit: (item: WishlistItem) => void;
  onDelete: (id: string) => void;
  onTogglePriceAlert?: (id: string, enabled: boolean) => void;
  isDeleting: boolean;
  isTogglingAlert?: boolean;
  isDragging?: boolean;
  canUsePriceAlerts?: boolean;
  t: (key: string, values?: Record<string, unknown>) => string;
  tPriority: (key: string) => string;
}

function getPriorityConfig(priority: string) {
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
        gradient: "from-primary to-accent",
      };
    default:
      return {
        variant: "outline" as const,
        icon: Heart,
        gradient: "from-accent to-primary/70",
      };
  }
}

function formatPrice(price: string | null, priceMax: string | null, currency: string) {
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
}

export function SortableItem({
  item,
  onEdit,
  onDelete,
  onTogglePriceAlert,
  isDeleting,
  isTogglingAlert,
  isDragging: externalIsDragging,
  canUsePriceAlerts,
  t,
  tPriority,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityConfig = getPriorityConfig(item.priority);
  const PriorityIcon = priorityConfig.icon;
  const isItemDragging = isDragging || externalIsDragging;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "group border-0 bg-card/80 backdrop-blur-sm card-hover overflow-hidden",
        isItemDragging && "opacity-50 shadow-2xl scale-[1.02] z-50"
      )}
    >
      {/* Priority indicator bar */}
      <div className={`h-1 bg-gradient-to-r ${priorityConfig.gradient}`} />

      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start gap-3">
          {/* Drag handle */}
          <div
            {...attributes}
            {...listeners}
            className="shrink-0 cursor-grab active:cursor-grabbing touch-none"
          >
            <div className="p-1 rounded-md hover:bg-muted transition-colors">
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>

          {/* Item image - prefer uploaded image over scraped URL */}
          {(item.uploadedImage || item.imageUrl) && (
            <ItemImage
              src={item.uploadedImage || item.imageUrl!}
              alt={item.title}
            />
          )}

          <div className="flex-1 min-w-0 py-0.5">
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
                  onClick={(e) => e.stopPropagation()}
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

          {/* Action buttons */}
          <div className="shrink-0 flex flex-col gap-1 pt-1">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10"
              onClick={() => onEdit(item)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            {/* Price alert toggle - only show for Complete tier users with items that have URL and price */}
            {canUsePriceAlerts && item.url && item.price && onTogglePriceAlert && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "rounded-xl",
                      item.priceAlertEnabled
                        ? "text-green-500 hover:text-green-600 hover:bg-green-500/10"
                        : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                    )}
                    onClick={() => onTogglePriceAlert(item.id, !item.priceAlertEnabled)}
                    disabled={isTogglingAlert}
                  >
                    {isTogglingAlert ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : item.priceAlertEnabled ? (
                      <Bell className="h-4 w-4" />
                    ) : (
                      <BellOff className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {item.priceAlertEnabled ? t("priceAlertDisable") : t("priceAlertEnable")}
                </TooltipContent>
              </Tooltip>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(item.id)}
              disabled={isDeleting}
            >
              {isDeleting ? (
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
}
