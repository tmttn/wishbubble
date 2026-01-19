"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTypedTranslations } from "@/i18n/useTypedTranslations";
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
  ArrowRight,
  Check,
  ShoppingBag,
  AlertCircle,
  ImageIcon,
} from "lucide-react";
import { ImageUpload } from "@/components/ui/image-upload";
import { toast } from "sonner";
import {
  addItemSchema,
  type AddItemInput,
} from "@/lib/validators/wishlist";

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
  uploadedImage: string | null;
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
  const t = useTypedTranslations("wishlist");
  const tPriority = useTypedTranslations("wishlist.priority");
  const tCommon = useTypedTranslations("common");

  const isEditMode = !!editItem;

  const [urlInput, setUrlInput] = useState("");
  const [isScraping, setIsScraping] = useState(false);
  const [scrapedData, setScrapedData] = useState<ScrapedData | null>(null);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const lastScrapedUrlRef = useRef<string | null>(null);

  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([]);
  const [isSearchAvailable, setIsSearchAvailable] = useState<boolean | null>(
    null
  );
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

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
        uploadedImage: editItem.uploadedImage || "",
        priority: editItem.priority as "MUST_HAVE" | "NICE_TO_HAVE" | "DREAM",
        quantity: editItem.quantity || 1,
        notes: editItem.notes || "",
      });
      if (editItem.url) {
        setUrlInput(editItem.url);
        // Mark as already scraped so we don't re-scrape on edit
        lastScrapedUrlRef.current = editItem.url;
      }
      // Set uploaded image state
      setUploadedImage(editItem.uploadedImage || null);
    } else {
      // Reset to empty form when not editing
      setUrlInput("");
      setScrapedData(null);
      setScrapeError(null);
      lastScrapedUrlRef.current = null;
      setUploadedImage(null);
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

  // Auto-search when input is not a URL (debounced)
  useEffect(() => {
    // Only search if: has input, not a URL, and search is available
    if (!urlInput.trim() || isValidUrl(urlInput) || !isSearchAvailable) {
      // Clear search results if input is empty or is a URL
      if (searchResults.length > 0) {
        setSearchResults([]);
      }
      return;
    }

    // Debounce the search to avoid too many requests while typing
    const timeoutId = setTimeout(() => {
      // Trigger search
      setIsSearching(true);
      const params = new URLSearchParams({ q: urlInput.trim() });
      fetch(`/api/products/search?${params}`)
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

      // Clear search results and input
      setSearchResults([]);
      setUrlInput("");

      toast.success(t("productSelected"));
    },
    [setValue, t]
  );

  const handleFormSubmit = async (data: AddItemInput) => {
    // Include uploadedImage in the data
    const submitData = {
      ...data,
      uploadedImage: uploadedImage || "",
    };
    await onSubmit(submitData);
    if (!isEditMode) {
      reset();
      setUrlInput("");
      setScrapedData(null);
      setScrapeError(null);
      lastScrapedUrlRef.current = null;
      setSearchResults([]);
      setUploadedImage(null);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      {/* Combined URL/Search Input Section */}
      <div className="space-y-3 p-4 bg-muted/50 rounded-xl border border-border/50">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          {isSearchAvailable ? (
            <>
              <Search className="h-4 w-4" />
              {t("searchOrPasteUrl")}
            </>
          ) : (
            <>
              <LinkIcon className="h-4 w-4" />
              {t("pasteUrl")}
            </>
          )}
        </div>
        <div className="relative">
          <Input
            value={urlInput}
            onChange={(e) => {
              setUrlInput(e.target.value);
              // Reset error and scraped data when input changes
              if (scrapeError) setScrapeError(null);
              if (scrapedData) setScrapedData(null);
            }}
            placeholder={isSearchAvailable ? t("searchOrUrlPlaceholder") : t("urlPlaceholder")}
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

        {/* Link to full search page */}
        {isSearchAvailable && (
          <Link
            href="/search"
            className="text-sm text-primary hover:underline flex items-center gap-1 mt-2"
          >
            {t("browseLink")}
            <ArrowRight className="h-3 w-3" />
          </Link>
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
      <input type="hidden" {...register("uploadedImage")} />

      {/* Image Upload Section */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          {t("item.image")}
        </Label>
        <ImageUpload
          value={uploadedImage || watch("imageUrl") || null}
          onChange={(url) => {
            if (url) {
              // If it's an uploaded image (blob URL), set uploadedImage
              if (url.includes("blob.vercel-storage.com")) {
                setUploadedImage(url);
                setValue("uploadedImage", url);
              } else {
                // Otherwise it's a scraped imageUrl
                setValue("imageUrl", url);
              }
            } else {
              // Clear both
              setUploadedImage(null);
              setValue("uploadedImage", "");
              setValue("imageUrl", "");
            }
          }}
          disabled={isSubmitting}
        />
        <p className="text-xs text-muted-foreground">{t("item.imageHint")}</p>
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
