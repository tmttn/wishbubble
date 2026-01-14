"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Package,
  Upload,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Clock,
  Database,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ConfirmationDialog,
  useConfirmation,
} from "@/components/ui/confirmation-dialog";
import { useTypedTranslations } from "@/i18n/useTypedTranslations";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AdminClientPagination, AdminClientSearch, AdminClientSortHeader } from "@/components/admin";

interface ProductProvider {
  id: string;
  providerId: string;
  name: string;
  type: "REALTIME" | "FEED" | "SCRAPER";
  enabled: boolean;
  priority: number;
  feedUrl: string | null;
  affiliateCode: string | null;
  affiliateParam: string | null;
  urlPatterns: string | null;
  lastSynced: string | null;
  syncStatus: "PENDING" | "SYNCING" | "SUCCESS" | "FAILED";
  syncError: string | null;
  productCount: number;
  createdAt: string;
  updatedAt: string;
  recentImports?: ImportLog[];
}

interface ImportLog {
  id: string;
  fileName: string | null;
  fileSize: number | null;
  recordsTotal: number;
  recordsImported: number;
  recordsFailed: number;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
}

interface AwinFeed {
  advertiserId: string;
  advertiserName: string;
  region: string;
  membershipStatus: string;
  feedFormat: string;
  feedId: string;
  feedName: string;
  language: string;
  vertical: string;
  lastImported: string;
  lastChecked: string;
  productCount: number;
  url: string;
}

function formatDate(dateString: string | null, neverText: string): string {
  if (!dateString) return neverText;
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(
  startedAt: string,
  completedAt: string | null
): string {
  if (!completedAt) return "-";
  const start = new Date(startedAt).getTime();
  const end = new Date(completedAt).getTime();
  const durationMs = end - start;

  if (durationMs < 1000) return `${durationMs}ms`;
  if (durationMs < 60000) return `${(durationMs / 1000).toFixed(1)}s`;
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.round((durationMs % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

function extractFileName(filePath: string | null): string {
  if (!filePath) return "-";
  // For URLs, try to extract a meaningful identifier
  if (filePath.startsWith("http")) {
    // Try to get the last path segment or a query param like fid
    const fidMatch = filePath.match(/fid[=/](\d+)/i);
    if (fidMatch) return `Feed #${fidMatch[1]}`;
    // Otherwise get the last path segment
    const pathSegments = filePath.split("/").filter(Boolean);
    const lastSegment = pathSegments[pathSegments.length - 1];
    if (lastSegment && lastSegment.length < 50) return lastSegment;
    return "URL Import";
  }
  // For file paths, get the filename
  return filePath.split("/").pop() || filePath;
}

function getTypeColor(type: string): string {
  switch (type) {
    case "REALTIME":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100";
    case "FEED":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100";
    case "SCRAPER":
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100";
    default:
      return "";
  }
}

function getSyncStatusBadge(
  status: string,
  translations: {
    synced: string;
    failed: string;
    syncing: string;
    pending: string;
  }
) {
  switch (status) {
    case "SUCCESS":
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
          <CheckCircle className="h-3 w-3 mr-1" />
          {translations.synced}
        </Badge>
      );
    case "FAILED":
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          {translations.failed}
        </Badge>
      );
    case "SYNCING":
      return (
        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
          {translations.syncing}
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary">
          <Clock className="h-3 w-3 mr-1" />
          {translations.pending}
        </Badge>
      );
  }
}

export default function ProductFeedsPage() {
  const t = useTypedTranslations("admin.productFeeds");
  const tConfirmations = useTypedTranslations("confirmations");
  const [providers, setProviders] = useState<ProductProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [syncProgress, setSyncProgress] = useState<{
    progress: number;
    recordsTotal: number;
    recordsImported: number;
    recordsFailed: number;
  } | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { confirm, dialogProps } = useConfirmation();

  // Awin feeds state
  const [awinFeeds, setAwinFeeds] = useState<AwinFeed[]>([]);
  const [isLoadingFeeds, setIsLoadingFeeds] = useState(false);
  const [feedsError, setFeedsError] = useState<string | null>(null);
  const [selectedAwinFeed, setSelectedAwinFeed] = useState<string>("");
  const [feedSearchQuery, setFeedSearchQuery] = useState("");

  // Filtering, sorting, and pagination state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<string>("priority");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [typeFilter, setTypeFilter] = useState<"all" | "FEED" | "REALTIME" | "SCRAPER">("all");

  // Create form state
  const [formData, setFormData] = useState({
    providerId: "",
    name: "",
    type: "FEED" as "REALTIME" | "FEED" | "SCRAPER",
    enabled: true,
    priority: 0,
    feedUrl: "",
    affiliateCode: "",
    affiliateParam: "",
    urlPatterns: "",
  });

  useEffect(() => {
    fetchProviders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll for sync progress when syncing
  const pollSyncProgress = useCallback(async (providerId: string) => {
    try {
      const response = await fetch(
        `/api/admin/product-feeds/sync?providerId=${providerId}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.status === "processing") {
          setSyncProgress({
            progress: data.progress || 0,
            recordsTotal: data.recordsTotal || 0,
            recordsImported: data.recordsImported || 0,
            recordsFailed: data.recordsFailed || 0,
          });
        } else if (data.status === "completed" || data.status === "failed") {
          setSyncProgress(null);
          setIsSyncing(null);
          fetchProviders();
          if (data.status === "completed") {
            toast.success(
              t("toasts.syncSuccess", {
                imported: data.recordsImported,
                failed: data.recordsFailed,
              })
            );
          } else {
            toast.error(data.errorMessage || t("toasts.syncFailed"));
          }
        }
      }
    } catch {
      // Ignore polling errors
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  useEffect(() => {
    if (!isSyncing) return;

    const interval = setInterval(() => {
      pollSyncProgress(isSyncing);
    }, 1000);

    return () => clearInterval(interval);
  }, [isSyncing, pollSyncProgress]);

  // Fetch Awin feeds when dialog opens and type is FEED
  useEffect(() => {
    if (isCreateDialogOpen && formData.type === "FEED" && awinFeeds.length === 0 && !isLoadingFeeds) {
      fetchAwinFeeds();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCreateDialogOpen, formData.type]);

  const fetchAwinFeeds = async () => {
    setIsLoadingFeeds(true);
    setFeedsError(null);
    try {
      const response = await fetch("/api/admin/product-feeds/awin-feeds");
      const data = await response.json();
      if (response.ok) {
        setAwinFeeds(data.feeds || []);
      } else {
        setFeedsError(data.error || "Failed to load feeds");
      }
    } catch (error) {
      Sentry.captureException(error, {
        tags: { component: "ProductFeedsPage", action: "fetchAwinFeeds" },
      });
      setFeedsError("Failed to load Awin feeds");
    } finally {
      setIsLoadingFeeds(false);
    }
  };

  const handleAwinFeedSelect = (feedId: string) => {
    setSelectedAwinFeed(feedId);
    const feed = awinFeeds.find((f) => f.feedId === feedId);
    if (feed) {
      // Generate a provider ID from advertiser name
      const providerId = `awin_${feed.advertiserName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_|_$/g, "")}`;

      setFormData({
        ...formData,
        providerId,
        name: feed.advertiserName,
        feedUrl: feed.url,
        type: "FEED",
      });
    }
  };

  // Filter feeds based on search
  const filteredAwinFeeds = useMemo(() => {
    if (!feedSearchQuery) return awinFeeds;
    const query = feedSearchQuery.toLowerCase();
    return awinFeeds.filter(
      (feed) =>
        feed.advertiserName.toLowerCase().includes(query) ||
        feed.vertical.toLowerCase().includes(query) ||
        feed.region.toLowerCase().includes(query)
    );
  }, [awinFeeds, feedSearchQuery]);

  const fetchProviders = async () => {
    try {
      const response = await fetch("/api/admin/product-feeds");
      const data = await response.json();
      setProviders(data.providers || []);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { component: "ProductFeedsPage", action: "fetchProviders" },
      });
      toast.error(t("toasts.loadFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const createProvider = async () => {
    if (!formData.providerId || !formData.name) {
      toast.error(t("toasts.requiredFields"));
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch("/api/admin/product-feeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          feedUrl: formData.feedUrl || null,
          affiliateCode: formData.affiliateCode || null,
          affiliateParam: formData.affiliateParam || null,
          urlPatterns: formData.urlPatterns || null,
        }),
      });

      if (response.ok) {
        const createdProvider = await response.json();
        toast.success(t("toasts.providerCreated"));
        setIsCreateDialogOpen(false);

        const hasFeedUrl = formData.feedUrl;

        setFormData({
          providerId: "",
          name: "",
          type: "FEED",
          enabled: true,
          priority: 0,
          feedUrl: "",
          affiliateCode: "",
          affiliateParam: "",
          urlPatterns: "",
        });
        setSelectedAwinFeed("");
        setFeedSearchQuery("");
        await fetchProviders();

        // Auto-sync if it's a feed provider with a URL
        if (hasFeedUrl && createdProvider.provider?.id) {
          toast.info(t("toasts.startingSync"));
          // Use the same sync handler as the manual sync button
          const newProvider = {
            ...createdProvider.provider,
            feedUrl: formData.feedUrl,
          } as ProductProvider;
          handleSyncFromUrl(newProvider);
        }
      } else {
        const error = await response.json();
        toast.error(error.error || t("toasts.createFailed"));
      }
    } catch (error) {
      Sentry.captureException(error, {
        tags: { component: "ProductFeedsPage", action: "createProvider" },
      });
      toast.error(t("toasts.createFailed"));
    } finally {
      setIsCreating(false);
    }
  };

  const toggleProvider = async (provider: ProductProvider) => {
    try {
      const response = await fetch(`/api/admin/product-feeds/${provider.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !provider.enabled }),
      });

      if (response.ok) {
        toast.success(
          provider.enabled
            ? t("toasts.providerDisabled")
            : t("toasts.providerEnabled")
        );
        fetchProviders();
      } else {
        toast.error(t("toasts.updateFailed"));
      }
    } catch (error) {
      Sentry.captureException(error, {
        tags: { component: "ProductFeedsPage", action: "toggleProvider" },
      });
      toast.error(t("toasts.updateFailed"));
    }
  };

  const deleteProvider = (provider: ProductProvider) => {
    const doDelete = async () => {
      try {
        const response = await fetch(
          `/api/admin/product-feeds/${provider.id}`,
          {
            method: "DELETE",
          }
        );

        if (response.ok) {
          toast.success(t("toasts.providerDeleted"));
          fetchProviders();
        } else {
          toast.error(t("toasts.deleteFailed"));
        }
      } catch (error) {
        Sentry.captureException(error, {
          tags: { component: "ProductFeedsPage", action: "deleteProvider" },
        });
        toast.error(t("toasts.deleteFailed"));
      }
    };

    confirm({
      title: t("deleteConfirm.title"),
      description: t("deleteConfirm.description", {
        name: provider.name,
        count: provider.productCount,
      }),
      confirmText: tConfirmations("delete"),
      cancelText: tConfirmations("cancel"),
      variant: "destructive",
      onConfirm: doDelete,
    });
  };

  const handleImportClick = (providerId: string) => {
    setSelectedProviderId(providerId);
    setIsImportDialogOpen(true);
  };

  const handleSyncFromUrl = async (provider: ProductProvider) => {
    if (!provider.feedUrl) {
      toast.error(t("toasts.noFeedUrl"));
      return;
    }

    setIsSyncing(provider.id);
    setSyncProgress(null);

    // Start polling for progress immediately
    const pollInterval = setInterval(async () => {
      try {
        const progressRes = await fetch(
          `/api/admin/product-feeds/sync?providerId=${provider.id}`
        );
        if (progressRes.ok) {
          const progress = await progressRes.json();
          if (progress.status === "processing") {
            setSyncProgress({
              progress: progress.progress || 0,
              recordsImported: progress.recordsImported || 0,
              recordsTotal: progress.recordsTotal || 0,
              recordsFailed: progress.recordsFailed || 0,
            });
          }
        }
      } catch {
        // Ignore polling errors
      }
    }, 1000);

    try {
      // Start sync - this will block until complete
      const response = await fetch("/api/admin/product-feeds/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId: provider.id }),
      });

      clearInterval(pollInterval);
      const result = await response.json();

      if (response.ok) {
        // Sync completed successfully
        toast.success(
          t("toasts.syncSuccess", {
            imported: result.imported,
            failed: result.failed,
          })
        );
        setIsSyncing(null);
        setSyncProgress(null);
        fetchProviders();
      } else {
        toast.error(result.error || t("toasts.syncFailed"));
        setIsSyncing(null);
        setSyncProgress(null);
      }
    } catch (error) {
      clearInterval(pollInterval);
      Sentry.captureException(error, {
        tags: { component: "ProductFeedsPage", action: "syncFromUrl" },
      });
      toast.error(t("toasts.syncFailed"));
      setIsSyncing(null);
      setSyncProgress(null);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !selectedProviderId) return;

    // Validate file type
    if (!file.name.endsWith(".csv") && !file.name.endsWith(".txt")) {
      toast.error(t("toasts.invalidFileType"));
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error(t("toasts.fileTooLarge"));
      return;
    }

    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("providerId", selectedProviderId);

      const response = await fetch("/api/admin/product-feeds/import", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(
          t("toasts.importSuccess", {
            imported: result.imported,
            failed: result.failed,
          })
        );
        setIsImportDialogOpen(false);
        fetchProviders();
      } else {
        toast.error(result.error || t("toasts.importFailed"));
        if (result.parseErrors?.length > 0) {
          console.error("Parse errors:", result.parseErrors);
        }
      }
    } catch (error) {
      Sentry.captureException(error, {
        tags: { component: "ProductFeedsPage", action: "importFeed" },
      });
      toast.error(t("toasts.importFailed"));
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const syncStatusTranslations = {
    synced: t("syncStatus.synced"),
    failed: t("syncStatus.failed"),
    syncing: t("syncStatus.syncing"),
    pending: t("syncStatus.pending"),
  };

  const activeProviders = providers.filter((p) => p.enabled);
  const totalProducts = providers.reduce((acc, p) => acc + p.productCount, 0);
  const feedProviders = providers.filter((p) => p.type === "FEED");

  // Filter and sort providers
  const filteredAndSortedProviders = useMemo(() => {
    let filtered = providers;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.providerId.toLowerCase().includes(query)
      );
    }

    // Apply type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((p) => p.type === typeFilter);
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sortKey === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortKey === "productCount") {
        comparison = a.productCount - b.productCount;
      } else if (sortKey === "lastSynced") {
        const aDate = a.lastSynced ? new Date(a.lastSynced).getTime() : 0;
        const bDate = b.lastSynced ? new Date(b.lastSynced).getTime() : 0;
        comparison = aDate - bDate;
      } else if (sortKey === "type") {
        comparison = a.type.localeCompare(b.type);
      } else {
        // Default: priority
        comparison = a.priority - b.priority;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [providers, searchQuery, typeFilter, sortKey, sortOrder]);

  // Paginate
  const totalPages = Math.ceil(filteredAndSortedProviders.length / perPage);
  const paginatedProviders = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredAndSortedProviders.slice(start, start + perPage);
  }, [filteredAndSortedProviders, currentPage, perPage]);

  // Reset to page 1 when filters change
  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleSort = (key: string, order: "asc" | "desc") => {
    setSortKey(key);
    setSortOrder(order);
    setCurrentPage(1);
  };

  const handleTypeFilter = (type: "all" | "FEED" | "REALTIME" | "SCRAPER") => {
    setTypeFilter(type);
    setCurrentPage(1);
  };

  const handlePerPageChange = (value: number) => {
    setPerPage(value);
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="container py-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display bg-gradient-to-r from-purple-600 to-fuchsia-600 bg-clip-text text-transparent">{t("title")}</h1>
          <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t("addProvider")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{t("createDialog.title")}</DialogTitle>
              <DialogDescription>
                {t("createDialog.description")}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="providerId">
                  {t("createDialog.fields.providerId")}
                </Label>
                <Input
                  id="providerId"
                  value={formData.providerId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      providerId: e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9_]/g, "_"),
                    })
                  }
                  placeholder={t("createDialog.fields.providerIdPlaceholder")}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  {t("createDialog.fields.providerIdHint")}
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="name">
                  {t("createDialog.fields.displayName")}
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder={t("createDialog.fields.displayNamePlaceholder")}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>{t("createDialog.fields.type")}</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v) =>
                      setFormData({
                        ...formData,
                        type: v as "REALTIME" | "FEED" | "SCRAPER",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FEED">{t("types.feed")}</SelectItem>
                      <SelectItem value="REALTIME">
                        {t("types.realtime")}
                      </SelectItem>
                      <SelectItem value="SCRAPER">
                        {t("types.scraper")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="priority">
                    {t("createDialog.fields.priority")}
                  </Label>
                  <Input
                    id="priority"
                    type="number"
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        priority: parseInt(e.target.value) || 0,
                      })
                    }
                    min={0}
                    max={100}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("createDialog.fields.priorityHint")}
                  </p>
                </div>
              </div>

              {formData.type === "FEED" && (
                <div className="grid gap-2">
                  <Label>{t("createDialog.fields.awinFeed")}</Label>
                  {isLoadingFeeds ? (
                    <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">
                        {t("createDialog.fields.loadingFeeds")}
                      </span>
                    </div>
                  ) : feedsError ? (
                    <div className="flex items-center gap-2 p-3 border rounded-md bg-destructive/10 text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">{feedsError}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={fetchAwinFeeds}
                        className="ml-auto"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Input
                        placeholder={t("createDialog.fields.searchFeeds")}
                        value={feedSearchQuery}
                        onChange={(e) => setFeedSearchQuery(e.target.value)}
                        className="mb-2"
                      />
                      <div className="max-h-48 overflow-y-auto border rounded-md">
                        {filteredAwinFeeds.length === 0 ? (
                          <div className="p-3 text-sm text-muted-foreground text-center">
                            {t("createDialog.fields.noFeedsFound")}
                          </div>
                        ) : (
                          filteredAwinFeeds.map((feed) => (
                            <div
                              key={feed.feedId}
                              className={cn(
                                "flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 border-b last:border-b-0",
                                selectedAwinFeed === feed.feedId && "bg-primary/10"
                              )}
                              onClick={() => handleAwinFeedSelect(feed.feedId)}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">
                                  {feed.advertiserName}
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center gap-2">
                                  <span>{feed.region}</span>
                                  <span>•</span>
                                  <span>{feed.vertical}</span>
                                  <span>•</span>
                                  <span>{feed.productCount.toLocaleString()} {t("createDialog.fields.products")}</span>
                                </div>
                              </div>
                              {selectedAwinFeed === feed.feedId && (
                                <CheckCircle className="h-4 w-4 text-primary ml-2 flex-shrink-0" />
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {t("createDialog.fields.awinFeedHint")}
                  </p>
                </div>
              )}

              {/* Affiliate Configuration */}
              <div className="border-t pt-4 mt-2">
                <h4 className="font-medium mb-3 text-sm">
                  {t("createDialog.fields.affiliateSection")}
                </h4>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="urlPatterns">
                      {t("createDialog.fields.urlPatterns")}
                    </Label>
                    <Input
                      id="urlPatterns"
                      value={formData.urlPatterns}
                      onChange={(e) =>
                        setFormData({ ...formData, urlPatterns: e.target.value })
                      }
                      placeholder={t("createDialog.fields.urlPatternsPlaceholder")}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("createDialog.fields.urlPatternsHint")}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="affiliateParam">
                        {t("createDialog.fields.affiliateParam")}
                      </Label>
                      <Input
                        id="affiliateParam"
                        value={formData.affiliateParam}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            affiliateParam: e.target.value,
                          })
                        }
                        placeholder={t(
                          "createDialog.fields.affiliateParamPlaceholder"
                        )}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="affiliateCode">
                        {t("createDialog.fields.affiliateCode")}
                      </Label>
                      <Input
                        id="affiliateCode"
                        value={formData.affiliateCode}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            affiliateCode: e.target.value,
                          })
                        }
                        placeholder={t(
                          "createDialog.fields.affiliateCodePlaceholder"
                        )}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("createDialog.fields.affiliateHint")}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="enabled"
                  checked={formData.enabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, enabled: checked })
                  }
                />
                <Label htmlFor="enabled">
                  {t("createDialog.fields.enabled")}
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                {t("createDialog.buttons.cancel")}
              </Button>
              <Button
                onClick={createProvider}
                disabled={isCreating || !formData.providerId || !formData.name}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("createDialog.buttons.creating")}
                  </>
                ) : (
                  t("createDialog.buttons.create")
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-0 bg-gradient-to-br from-purple-500/10 to-purple-500/5 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-xl">
                <Package className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("stats.totalProviders")}</p>
                <p className="text-3xl font-bold">{providers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-gradient-to-br from-green-500/10 to-green-500/5 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-xl">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("stats.activeProviders")}</p>
                <p className="text-3xl font-bold">{activeProviders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-gradient-to-br from-blue-500/10 to-blue-500/5 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-xl">
                <Upload className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("stats.feedProviders")}</p>
                <p className="text-3xl font-bold">{feedProviders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-gradient-to-br from-amber-500/10 to-amber-500/5 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-xl">
                <Database className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("stats.totalProducts")}</p>
                <p className="text-3xl font-bold">{totalProducts.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <AdminClientSearch
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={handleSearch}
          />
          <div className="flex gap-2 flex-wrap">
            <Badge
              variant={typeFilter === "all" ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-sm"
              onClick={() => handleTypeFilter("all")}
            >
              {t("filters.all")} ({providers.length})
            </Badge>
            <Badge
              variant={typeFilter === "FEED" ? "default" : "outline"}
              className={cn("cursor-pointer px-3 py-1.5 text-sm", getTypeColor("FEED"))}
              onClick={() => handleTypeFilter("FEED")}
            >
              {t("types.feed")} ({feedProviders.length})
            </Badge>
            <Badge
              variant={typeFilter === "REALTIME" ? "default" : "outline"}
              className={cn("cursor-pointer px-3 py-1.5 text-sm", getTypeColor("REALTIME"))}
              onClick={() => handleTypeFilter("REALTIME")}
            >
              {t("types.realtime")} ({providers.filter((p) => p.type === "REALTIME").length})
            </Badge>
            <Badge
              variant={typeFilter === "SCRAPER" ? "default" : "outline"}
              className={cn("cursor-pointer px-3 py-1.5 text-sm", getTypeColor("SCRAPER"))}
              onClick={() => handleTypeFilter("SCRAPER")}
            >
              {t("types.scraper")} ({providers.filter((p) => p.type === "SCRAPER").length})
            </Badge>
          </div>
        </div>
        {/* Sort options */}
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">{t("sortBy")}:</span>
          <AdminClientSortHeader
            label={t("sortOptions.priority")}
            sortKey="priority"
            currentSort={sortKey}
            currentOrder={sortOrder}
            onSort={handleSort}
          />
          <AdminClientSortHeader
            label={t("sortOptions.name")}
            sortKey="name"
            currentSort={sortKey}
            currentOrder={sortOrder}
            onSort={handleSort}
          />
          <AdminClientSortHeader
            label={t("sortOptions.products")}
            sortKey="productCount"
            currentSort={sortKey}
            currentOrder={sortOrder}
            onSort={handleSort}
          />
          <AdminClientSortHeader
            label={t("sortOptions.lastSynced")}
            sortKey="lastSynced"
            currentSort={sortKey}
            currentOrder={sortOrder}
            onSort={handleSort}
          />
        </div>
      </div>

      {/* Providers Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("table.allProviders")}</CardTitle>
          <CardDescription>{t("table.allProvidersDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {paginatedProviders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t("empty.title")}</p>
              <p className="text-sm">{t("empty.description")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table.headers.provider")}</TableHead>
                  <TableHead>{t("table.headers.type")}</TableHead>
                  <TableHead>{t("table.headers.products")}</TableHead>
                  <TableHead>{t("table.headers.lastSynced")}</TableHead>
                  <TableHead>{t("table.headers.status")}</TableHead>
                  <TableHead>{t("table.headers.enabled")}</TableHead>
                  <TableHead className="text-right">
                    {t("table.headers.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProviders.map((provider) => (
                  <TableRow key={provider.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{provider.name}</div>
                        <code className="text-xs text-muted-foreground">
                          {provider.providerId}
                        </code>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(provider.type)}>
                        {provider.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Database className="h-3 w-3 text-muted-foreground" />
                        {provider.productCount.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(provider.lastSynced, t("never"))}
                    </TableCell>
                    <TableCell>
                      {getSyncStatusBadge(
                        provider.syncStatus,
                        syncStatusTranslations
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={provider.enabled}
                        onCheckedChange={() => toggleProvider(provider)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      {isSyncing === provider.id ? (
                        <div className="flex items-center gap-3 min-w-[200px]">
                          <Progress
                            value={syncProgress?.progress ?? 0}
                            className="flex-1"
                          />
                          <span className="text-sm text-muted-foreground whitespace-nowrap">
                            {syncProgress ? `${syncProgress.progress}%` : t("sync.starting")}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          {provider.type === "FEED" && provider.feedUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSyncFromUrl(provider)}
                              disabled={isSyncing === provider.id}
                            >
                              {isSyncing === provider.id ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4 mr-1" />
                              )}
                              {t("sync.button")}
                            </Button>
                          )}
                          {provider.type === "FEED" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleImportClick(provider.id)}
                            >
                              <Upload className="h-4 w-4 mr-1" />
                              {t("import.button")}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600"
                            onClick={() => deleteProvider(provider)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {filteredAndSortedProviders.length > 0 && (
            <div className="mt-4">
              <AdminClientPagination
                page={currentPage}
                totalPages={totalPages}
                total={filteredAndSortedProviders.length}
                perPage={perPage}
                onPageChange={setCurrentPage}
                onPerPageChange={handlePerPageChange}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Imports Section */}
      {feedProviders.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{t("recentImports.title")}</CardTitle>
            <CardDescription>{t("recentImports.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            {providers.flatMap((p) => p.recentImports || []).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>{t("recentImports.empty")}</p>
              </div>
            ) : (
              <TooltipProvider>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("recentImports.headers.provider")}</TableHead>
                      <TableHead>{t("recentImports.headers.file")}</TableHead>
                      <TableHead>{t("recentImports.headers.size")}</TableHead>
                      <TableHead>{t("recentImports.headers.records")}</TableHead>
                      <TableHead>{t("recentImports.headers.status")}</TableHead>
                      <TableHead>{t("recentImports.headers.duration")}</TableHead>
                      <TableHead>{t("recentImports.headers.date")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {providers
                      .flatMap((p) =>
                        (p.recentImports || []).map((imp) => ({
                          ...imp,
                          providerName: p.name,
                        }))
                      )
                      .sort(
                        (a, b) =>
                          new Date(b.startedAt).getTime() -
                          new Date(a.startedAt).getTime()
                      )
                      .slice(0, 10)
                      .map((imp) => (
                        <TableRow key={imp.id}>
                          <TableCell className="font-medium">
                            {imp.providerName}
                          </TableCell>
                          <TableCell>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="font-mono text-sm cursor-help max-w-[200px] truncate block">
                                  {extractFileName(imp.fileName)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-[400px] break-all">
                                <p className="text-xs">{imp.fileName || "-"}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatFileSize(imp.fileSize)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span>
                                <span className="text-green-600 font-medium">
                                  {imp.recordsImported.toLocaleString()}
                                </span>
                                {imp.recordsTotal > 0 && (
                                  <span className="text-muted-foreground">
                                    {" "}/ {imp.recordsTotal.toLocaleString()}
                                  </span>
                                )}
                              </span>
                              {imp.recordsFailed > 0 && (
                                <span className="text-xs text-red-500">
                                  {imp.recordsFailed.toLocaleString()} {t("recentImports.failed")}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {imp.status === "COMPLETED" ? (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                {t("recentImports.status.completed")}
                              </Badge>
                            ) : imp.status === "FAILED" ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="destructive" className="cursor-help">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    {t("recentImports.status.failed")}
                                  </Badge>
                                </TooltipTrigger>
                                {imp.errorMessage && (
                                  <TooltipContent side="top" className="max-w-[300px]">
                                    <p className="text-xs font-medium mb-1">{t("recentImports.errorReason")}</p>
                                    <p className="text-xs">{imp.errorMessage}</p>
                                  </TooltipContent>
                                )}
                              </Tooltip>
                            ) : imp.status === "PROCESSING" ? (
                              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                {t("recentImports.status.processing")}
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                {t("recentImports.status.pending")}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDuration(imp.startedAt, imp.completedAt)}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help">
                                  {formatDate(imp.startedAt, t("never"))}
                                </span>
                              </TooltipTrigger>
                              {imp.completedAt && (
                                <TooltipContent side="top">
                                  <p className="text-xs">
                                    {t("recentImports.completedAt")}: {formatDate(imp.completedAt, "-")}
                                  </p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TooltipProvider>
            )}
          </CardContent>
        </Card>
      )}

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("import.dialogTitle")}</DialogTitle>
            <DialogDescription>
              {t("import.dialogDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="csvFile">{t("import.csvFile")}</Label>
              <Input
                ref={fileInputRef}
                id="csvFile"
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                disabled={isImporting}
              />
              <p className="text-xs text-muted-foreground">
                {t("import.maxFileSize")}
              </p>
            </div>

            {isImporting && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>{t("import.importing")}</span>
              </div>
            )}

            <div className="rounded-lg border p-4 bg-muted/50">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {t("import.expectedFormat")}
              </h4>
              <p className="text-sm text-muted-foreground mb-2">
                {t("import.expectedFormatDescription")}
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>
                  <code>aw_product_id</code> or <code>product_id</code>{" "}
                  (required)
                </li>
                <li>
                  <code>product_name</code> or <code>title</code> (required)
                </li>
                <li>
                  <code>merchant_deep_link</code> or <code>product_url</code>{" "}
                  (required)
                </li>
                <li>
                  <code>search_price</code> or <code>price</code>
                </li>
                <li>
                  <code>aw_image_url</code> or <code>image_url</code>
                </li>
                <li>
                  <code>ean</code>, <code>brand_name</code>,{" "}
                  <code>category_name</code>
                </li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsImportDialogOpen(false)}
              disabled={isImporting}
            >
              {t("import.cancel")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog {...dialogProps} />
    </div>
  );
}
