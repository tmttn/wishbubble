"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Plus, Loader2, Star, Heart, Sparkles, Search, Link as LinkIcon, Check, ShoppingBag, AlertCircle, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
} from "@/components/ui/responsive-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ImageUpload } from "@/components/ui/image-upload";
import { GuestWishlistItem } from "@/lib/guest-wishlist/types";

// Helper to check if a string looks like a URL
function isValidUrl(str: string): boolean {
  if (!str.trim()) return false;
  try {
    const urlString =
      str.startsWith("http://") || str.startsWith("https://")
        ? str
        : `https://${str}`;
    const url = new URL(urlString);
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

interface GuestAddItemFormProps {
  onAddItem: (item: Omit<GuestWishlistItem, "id" | "createdAt">) => void;
}

export function GuestAddItemForm({ onAddItem }: GuestAddItemFormProps) {
  const t = useTranslations("guest.wishlist");
  const tWishlist = useTranslations("wishlist");
  const tPriority = useTranslations("wishlist.priority");
  const tCommon = useTranslations("common");

  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [urlInput, setUrlInput] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [url, setUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [priority, setPriority] = useState<"MUST_HAVE" | "NICE_TO_HAVE" | "DREAM">("NICE_TO_HAVE");
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");

  // Scraping state
  const [isScraping, setIsScraping] = useState(false);
  const [scrapedData, setScrapedData] = useState<ScrapedData | null>(null);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const lastScrapedUrlRef = useRef<string | null>(null);

  // Search state
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([]);
  const [isSearchAvailable, setIsSearchAvailable] = useState<boolean | null>(null);

  // Check if product search is available
  useEffect(() => {
    const checkSearchAvailability = async () => {
      try {
        const response = await fetch("/api/guest/products/search/available");
        if (response.ok) {
          const data = await response.json();
          setIsSearchAvailable(data.available);
        }
      } catch {
        setIsSearchAvailable(false);
      }
    };
    if (open) {
      checkSearchAvailability();
    }
  }, [open]);

  // Scrape URL for product info
  const handleScrapeUrl = useCallback(
    async (urlToScrape: string) => {
      if (!urlToScrape.trim()) return;

      // Don't re-scrape the same URL
      if (lastScrapedUrlRef.current === urlToScrape.trim()) return;

      setIsScraping(true);
      setScrapeError(null);
      setScrapedData(null);

      try {
        const response = await fetch("/api/guest/products/scrape", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: urlToScrape.trim() }),
        });

        const result = await response.json();
        lastScrapedUrlRef.current = urlToScrape.trim();

        if (result.success && result.data) {
          setScrapedData(result.data);
          setScrapeError(null);

          // Auto-fill form with scraped data
          if (result.data.title) {
            setTitle(result.data.title);
          }
          if (result.data.description) {
            setDescription(result.data.description);
          }
          if (result.data.price) {
            setPrice(String(result.data.price));
          }
          if (result.data.url) {
            setUrl(result.data.url);
          }
          if (result.data.imageUrl) {
            setImageUrl(result.data.imageUrl);
          }

          toast.success(tWishlist("urlScraped"));
        } else {
          // Check for specific retailer errors
          const errorMsg = result.error || "";
          let errorMessage: string;
          if (errorMsg.includes("Amazon")) {
            errorMessage = tWishlist("scrapeErrorAmazon");
          } else if (errorMsg.includes("Coolblue")) {
            errorMessage = tWishlist("scrapeErrorCoolblue");
          } else if (errorMsg.includes("Bol.com")) {
            errorMessage = tWishlist("scrapeErrorBolcom");
          } else {
            errorMessage = tWishlist("scrapeError");
          }
          setScrapeError(errorMessage);
          // Still set the URL so user doesn't have to re-enter it
          setUrl(urlToScrape.trim());
        }
      } catch {
        setScrapeError(tWishlist("scrapeError"));
      } finally {
        setIsScraping(false);
      }
    },
    [tWishlist]
  );

  // Auto-scrape URL when a valid URL is entered (debounced)
  useEffect(() => {
    if (!urlInput.trim() || !isValidUrl(urlInput)) {
      return;
    }

    const timeoutId = setTimeout(() => {
      handleScrapeUrl(urlInput);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [urlInput, handleScrapeUrl]);

  // Auto-search when input is not a URL (debounced)
  useEffect(() => {
    // Only search if: has input, not a URL, and search is available
    if (!urlInput.trim() || isValidUrl(urlInput) || !isSearchAvailable) {
      if (searchResults.length > 0) {
        setSearchResults([]);
      }
      return;
    }

    const timeoutId = setTimeout(() => {
      setIsSearching(true);
      const params = new URLSearchParams({ q: urlInput.trim() });
      fetch(`/api/guest/products/search?${params}`)
        .then((response) => {
          if (!response.ok) throw new Error("Search failed");
          return response.json();
        })
        .then((result) => {
          setSearchResults(result.products || []);
        })
        .catch(() => {
          // Silently fail for auto-search
        })
        .finally(() => {
          setIsSearching(false);
        });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [urlInput, isSearchAvailable, searchResults.length]);

  // Select a product from search results
  const handleSelectProduct = useCallback(
    (product: SearchProduct) => {
      setTitle(product.title);
      if (product.description) {
        setDescription(product.description);
      }
      if (product.price) {
        setPrice(String(product.price));
      }
      setUrl(product.url);
      if (product.imageUrl) {
        setImageUrl(product.imageUrl);
      }

      // Clear search results and input
      setSearchResults([]);
      setUrlInput("");

      toast.success(tWishlist("productSelected"));
    },
    [tWishlist]
  );

  const resetForm = () => {
    setUrlInput("");
    setTitle("");
    setDescription("");
    setPrice("");
    setUrl("");
    setImageUrl("");
    setUploadedImage(null);
    setPriority("NICE_TO_HAVE");
    setQuantity("1");
    setNotes("");
    setScrapedData(null);
    setScrapeError(null);
    setSearchResults([]);
    lastScrapedUrlRef.current = null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error(t("titleRequired"));
      return;
    }

    setIsLoading(true);

    try {
      onAddItem({
        title: title.trim(),
        description: description.trim() || undefined,
        price: price ? parseFloat(price) : undefined,
        currency: "EUR",
        url: url.trim() || undefined,
        imageUrl: uploadedImage || imageUrl || undefined,
        priority,
        quantity: parseInt(quantity) || 1,
        notes: notes.trim() || undefined,
      });

      resetForm();
      setOpen(false);
      toast.success(t("itemAdded"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) {
        resetForm();
      }
    }}>
      <ResponsiveDialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          {t("addItem")}
        </Button>
      </ResponsiveDialogTrigger>
      <ResponsiveDialogContent className="sm:max-w-lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{t("addItemTitle")}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>{t("addItemDescription")}</ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Combined URL/Search Input Section */}
          <div className="space-y-3 p-4 bg-muted/50 rounded-xl border border-border/50">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              {isSearchAvailable ? (
                <>
                  <Search className="h-4 w-4" />
                  {tWishlist("searchOrPasteUrl")}
                </>
              ) : (
                <>
                  <LinkIcon className="h-4 w-4" />
                  {tWishlist("pasteUrl")}
                </>
              )}
            </div>
            <div className="relative">
              <Input
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  if (scrapeError) setScrapeError(null);
                  if (scrapedData) setScrapedData(null);
                }}
                placeholder={isSearchAvailable ? tWishlist("searchOrUrlPlaceholder") : tWishlist("urlPlaceholder")}
                className="rounded-xl pr-10"
              />
              {(isScraping || isSearching) && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
            {scrapedData && (
              <div className="flex items-center gap-2 text-sm text-accent">
                <Check className="h-4 w-4" />
                {tWishlist("dataFetched", {
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
                    <div className="relative w-12 h-12 rounded bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt=""
                          fill
                          className="object-contain"
                          sizes="48px"
                        />
                      ) : (
                        <ShoppingBag className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
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
            <Label htmlFor="title">{t("form.title")} *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("form.titlePlaceholder")}
              className="rounded-xl"
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
              className="rounded-xl min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">{t("form.url")}</Label>
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="rounded-xl"
            />
          </div>

          {/* Image Upload Section */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              {tWishlist("item.image")}
            </Label>
            <ImageUpload
              value={uploadedImage || imageUrl || null}
              onChange={(newUrl) => {
                if (newUrl) {
                  if (newUrl.includes("blob.vercel-storage.com")) {
                    setUploadedImage(newUrl);
                  } else {
                    setImageUrl(newUrl);
                  }
                } else {
                  setUploadedImage(null);
                  setImageUrl("");
                }
              }}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">{tWishlist("item.imageHint")}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">{t("form.price")}</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  &euro;
                </span>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="pl-8 rounded-xl"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">{tWishlist("item.quantity")}</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("form.priority")}</Label>
            <Select
              value={priority}
              onValueChange={(value) =>
                setPriority(value as "MUST_HAVE" | "NICE_TO_HAVE" | "DREAM")
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
            <Label htmlFor="notes">{tWishlist("item.notes")}</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={tWishlist("item.notesPlaceholder")}
              className="rounded-xl min-h-[80px]"
            />
          </div>

          <div className="px-4 pb-6 sm:px-0 sm:pb-0">
            <Button type="submit" className="w-full rounded-xl" disabled={isLoading || !title.trim()}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t("form.add")}
            </Button>
          </div>
        </form>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
