"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Star,
  Heart,
  Sparkles,
  Search,
  Link as LinkIcon,
  X,
  Check,
  ShoppingBag,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  addItemSchema,
  type AddItemInput,
} from "@/lib/validators/wishlist";
import { cn } from "@/lib/utils";

// Helper to check if a string looks like a URL
function isValidUrl(str: string): boolean {
  if (!str.trim()) return false;
  try {
    // Add protocol if missing
    const urlString =
      str.startsWith("http://") || str.startsWith("https://")
        ? str
        : `https://${str}`;
    const url = new URL(urlString);
    // Check if it has a valid hostname with a TLD
    return url.hostname.includes(".");
  } catch {
    return false;
  }
}

interface ScrapedData {
  title?: string;
  description?: string;
  price?: number;
  currency?: string;
  url?: string;
  imageUrl?: string;
  source?: string;
  retailer?: string;
}

interface SearchProduct {
  id: string;
  providerId: string;
  title: string;
  description?: string;
  price?: number;
  currency: string;
  url: string;
  imageUrl?: string;
  ean?: string;
  brand?: string;
  rating?: { average: number; count: number };
  originalPrice?: number;
  availability?: "in_stock" | "out_of_stock" | "unknown";
}

interface EditableItem {
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
}

interface AddItemFormProps {
  onSubmit: (data: AddItemInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  editItem?: EditableItem | null;
}

export function AddItemForm({
  onSubmit,
  onCancel,
  isSubmitting,
  editItem,
}: AddItemFormProps) {
  const t = useTranslations("wishlist");
  const tPriority = useTranslations("wishlist.priority");
  const tCommon = useTranslations("common");

  const isEditMode = !!editItem;

  const [urlInput, setUrlInput] = useState("");
  const [isScraping, setIsScraping] = useState(false);
  const [scrapedData, setScrapedData] = useState<ScrapedData | null>(null);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const lastScrapedUrlRef = useRef<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [isSearchAvailable, setIsSearchAvailable] = useState<boolean | null>(
    null
  );

  // Check if product search is available
  useEffect(() => {
    const checkSearchAvailability = async () => {
      try {
        const response = await fetch("/api/products/search/available");
        if (response.ok) {
          const data = await response.json();
          setIsSearchAvailable(data.available);
        }
      } catch {
        setIsSearchAvailable(false);
      }
    };
    checkSearchAvailability();
  }, []);

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

  // Populate form when editing
  useEffect(() => {
    if (editItem) {
      reset({
        title: editItem.title,
        description: editItem.description || "",
        price: editItem.price ? parseFloat(editItem.price) : undefined,
        currency: editItem.currency || "EUR",
        url: editItem.url || "",
        imageUrl: editItem.imageUrl || "",
        priority: editItem.priority as "MUST_HAVE" | "NICE_TO_HAVE" | "DREAM",
        quantity: editItem.quantity || 1,
        notes: editItem.notes || "",
      });
      if (editItem.url) {
        setUrlInput(editItem.url);
        // Mark as already scraped so we don't re-scrape on edit
        lastScrapedUrlRef.current = editItem.url;
      }
    } else {
      // Reset to empty form when not editing
      setUrlInput("");
      setScrapedData(null);
      setScrapeError(null);
      lastScrapedUrlRef.current = null;
    }
  }, [editItem, reset]);

  const priority = watch("priority");
  const title = watch("title");

  // Scrape URL for product info
  const handleScrapeUrl = useCallback(
    async (url: string) => {
      if (!url.trim()) return;

      // Don't re-scrape the same URL
      if (lastScrapedUrlRef.current === url.trim()) return;

      setIsScraping(true);
      setScrapeError(null);
      setScrapedData(null);

      try {
        const response = await fetch("/api/products/scrape", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: url.trim() }),
        });

        const result = await response.json();
        lastScrapedUrlRef.current = url.trim();

        if (result.success && result.data) {
          setScrapedData(result.data);
          setScrapeError(null);

          // Auto-fill form with scraped data
          if (result.data.title) {
            setValue("title", result.data.title);
          }
          if (result.data.description) {
            setValue("description", result.data.description);
          }
          if (result.data.price) {
            setValue("price", result.data.price);
          }
          if (result.data.currency) {
            setValue("currency", result.data.currency);
          }
          if (result.data.url) {
            setValue("url", result.data.url);
          }
          if (result.data.imageUrl) {
            setValue("imageUrl", result.data.imageUrl);
          }

          toast.success(t("urlScraped"));
        } else {
          // Check for specific retailer errors
          const errorMsg = result.error || "";
          let errorMessage: string;
          if (errorMsg.includes("Amazon")) {
            errorMessage = t("scrapeErrorAmazon");
          } else if (errorMsg.includes("Coolblue")) {
            errorMessage = t("scrapeErrorCoolblue");
          } else if (errorMsg.includes("Bol.com")) {
            errorMessage = t("scrapeErrorBolcom");
          } else {
            errorMessage = t("scrapeError");
          }
          setScrapeError(errorMessage);
          // Still set the URL so user doesn't have to re-enter it
          setValue("url", url.trim());
        }
      } catch {
        setScrapeError(t("scrapeError"));
      } finally {
        setIsScraping(false);
      }
    },
    [setValue, t]
  );

  // Auto-scrape URL when a valid URL is entered (debounced)
  useEffect(() => {
    if (!urlInput.trim() || !isValidUrl(urlInput)) {
      return;
    }

    // Don't auto-scrape in edit mode if URL hasn't changed
    if (isEditMode && urlInput === editItem?.url) {
      return;
    }

    // Debounce the scrape to avoid too many requests while typing
    const timeoutId = setTimeout(() => {
      handleScrapeUrl(urlInput);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [urlInput, handleScrapeUrl, isEditMode, editItem?.url]);

  // Search for products
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const params = new URLSearchParams({ q: searchQuery.trim() });
      const response = await fetch(`/api/products/search?${params}`);

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const result = await response.json();
      setSearchResults(result.products || []);

      if (result.products?.length === 0) {
        toast.info(t("noSearchResults"));
      }
    } catch {
      toast.error(t("searchError"));
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, t]);

  // Select a product from search results
  const handleSelectProduct = useCallback(
    (product: SearchProduct) => {
      setValue("title", product.title);
      if (product.description) {
        setValue("description", product.description);
      }
      if (product.price) {
        setValue("price", product.price);
      }
      setValue("currency", product.currency || "EUR");
      setValue("url", product.url);
      if (product.imageUrl) {
        setValue("imageUrl", product.imageUrl);
      }

      // Clear search
      setShowSearch(false);
      setSearchResults([]);
      setSearchQuery("");

      toast.success(t("productSelected"));
    },
    [setValue, t]
  );

  const handleFormSubmit = async (data: AddItemInput) => {
    await onSubmit(data);
    if (!isEditMode) {
      reset();
      setUrlInput("");
      setScrapedData(null);
      setScrapeError(null);
      lastScrapedUrlRef.current = null;
      setSearchResults([]);
      setSearchQuery("");
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      {/* URL Input Section */}
      <div className="space-y-3 p-4 bg-muted/50 rounded-xl border border-border/50">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <LinkIcon className="h-4 w-4" />
          {t("pasteUrl")}
        </div>
        <div className="relative">
          <Input
            value={urlInput}
            onChange={(e) => {
              setUrlInput(e.target.value);
              // Reset error and scraped data when URL changes
              if (scrapeError) setScrapeError(null);
              if (scrapedData) setScrapedData(null);
            }}
            placeholder={t("urlPlaceholder")}
            className="rounded-xl pr-10"
          />
          {isScraping && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
        {scrapedData && (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <Check className="h-4 w-4" />
            {t("dataFetched", {
              source: scrapedData.retailer || scrapedData.source || "website",
            })}
          </div>
        )}
        {scrapeError && (
          <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
            <AlertCircle className="h-4 w-4" />
            {scrapeError}
          </div>
        )}
      </div>

      {/* Product Search Section - only show if Bol.com is configured */}
      {isSearchAvailable && (
        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-xl justify-start gap-2"
            onClick={() => setShowSearch(!showSearch)}
          >
            <ShoppingBag className="h-4 w-4" />
            {t("searchProducts")}
            {showSearch && <X className="h-4 w-4 ml-auto" />}
          </Button>

          {showSearch && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-xl border border-border/50">
              <div className="flex gap-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("searchPlaceholder")}
                  className="rounded-xl flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSearch();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="rounded-xl"
                  onClick={handleSearch}
                  disabled={isSearching || !searchQuery.trim()}
                >
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {searchResults.map((product, index) => (
                    <button
                      key={product.ean || index}
                      type="button"
                      onClick={() => handleSelectProduct(product)}
                      className="w-full flex items-start gap-3 p-3 rounded-lg bg-background hover:bg-accent/50 transition-colors text-left"
                    >
                      {product.imageUrl && (
                        <img
                          src={product.imageUrl}
                          alt=""
                          className="w-12 h-12 object-contain rounded"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium line-clamp-2 text-sm">
                          {product.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {product.price && (
                            <span className="text-sm font-semibold text-primary">
                              {new Intl.NumberFormat("nl-NL", {
                                style: "currency",
                                currency: product.currency || "EUR",
                              }).format(product.price)}
                            </span>
                          )}
                          {product.rating && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              {product.rating.average.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            {tCommon("or")}
          </span>
        </div>
      </div>

      {/* Manual Form Fields */}
      <div className="space-y-2">
        <Label htmlFor="title">{t("item.title")} *</Label>
        <Input
          id="title"
          placeholder={t("item.titlePlaceholder")}
          className="rounded-xl"
          {...register("title")}
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t("item.description")}</Label>
        <Textarea
          id="description"
          placeholder={t("item.descriptionPlaceholder")}
          className="rounded-xl min-h-[80px]"
          {...register("description")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="url">{t("item.url")}</Label>
        <Input
          id="url"
          type="url"
          placeholder={t("item.urlPlaceholder")}
          className="rounded-xl"
          {...register("url")}
        />
      </div>

      {/* Hidden imageUrl field - populated by scraping */}
      <input type="hidden" {...register("imageUrl")} />

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
              className="pl-8 rounded-xl"
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
            className="rounded-xl"
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
          <SelectTrigger className="rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MUST_HAVE">
              <span className="flex items-center gap-2">
                <Star className="h-4 w-4 text-red-500" />
                {tPriority("MUST_HAVE")}
              </span>
            </SelectItem>
            <SelectItem value="NICE_TO_HAVE">
              <span className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-pink-500" />
                {tPriority("NICE_TO_HAVE")}
              </span>
            </SelectItem>
            <SelectItem value="DREAM">
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                {tPriority("DREAM")}
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">{t("item.notes")}</Label>
        <Textarea
          id="notes"
          placeholder={t("item.notesPlaceholder")}
          className="rounded-xl min-h-[80px]"
          {...register("notes")}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          className="flex-1 rounded-xl"
          onClick={onCancel}
        >
          {tCommon("cancel")}
        </Button>
        <Button
          type="submit"
          className="flex-1 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-90"
          disabled={isSubmitting || !title}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditMode ? t("saveItem") : t("addItem")}
        </Button>
      </div>
    </form>
  );
}
