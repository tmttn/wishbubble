"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect, useState, useRef } from "react";
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
import { useTranslations } from "next-intl";
import { toast } from "sonner";

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
  const t = useTranslations("admin.productFeeds");
  const tConfirmations = useTranslations("confirmations");
  const [providers, setProviders] = useState<ProductProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { confirm, dialogProps } = useConfirmation();

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
  }, []);

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
        toast.success(t("toasts.providerCreated"));
        setIsCreateDialogOpen(false);
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
        fetchProviders();
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

  const activeProviders = providers.filter((p) => p.enabled);
  const totalProducts = providers.reduce((acc, p) => acc + p.productCount, 0);
  const feedProviders = providers.filter((p) => p.type === "FEED");

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
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
                  <Label htmlFor="feedUrl">
                    {t("createDialog.fields.feedUrl")}
                  </Label>
                  <Input
                    id="feedUrl"
                    type="url"
                    value={formData.feedUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, feedUrl: e.target.value })
                    }
                    placeholder={t("createDialog.fields.feedUrlPlaceholder")}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("createDialog.fields.feedUrlHint")}
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
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("stats.totalProviders")}</CardDescription>
            <CardTitle className="text-2xl">{providers.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("stats.activeProviders")}</CardDescription>
            <CardTitle className="text-2xl">{activeProviders.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("stats.feedProviders")}</CardDescription>
            <CardTitle className="text-2xl">{feedProviders.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>{t("stats.totalProducts")}</CardDescription>
            <CardTitle className="text-2xl">
              {totalProducts.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Providers Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("table.allProviders")}</CardTitle>
          <CardDescription>{t("table.allProvidersDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {providers.length === 0 ? (
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
                {providers.map((provider) => (
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
                      <div className="flex items-center justify-end gap-2">
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("recentImports.headers.provider")}</TableHead>
                    <TableHead>{t("recentImports.headers.file")}</TableHead>
                    <TableHead>{t("recentImports.headers.size")}</TableHead>
                    <TableHead>{t("recentImports.headers.records")}</TableHead>
                    <TableHead>{t("recentImports.headers.status")}</TableHead>
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
                        <TableCell className="font-mono text-sm">
                          {imp.fileName || "-"}
                        </TableCell>
                        <TableCell>{formatFileSize(imp.fileSize)}</TableCell>
                        <TableCell>
                          <span className="text-green-600">
                            {imp.recordsImported}
                          </span>
                          {imp.recordsFailed > 0 && (
                            <span className="text-red-500">
                              {" "}
                              / {imp.recordsFailed} {t("recentImports.failed")}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {imp.status === "COMPLETED" ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {t("recentImports.status.completed")}
                            </Badge>
                          ) : imp.status === "FAILED" ? (
                            <Badge variant="destructive">
                              <XCircle className="h-3 w-3 mr-1" />
                              {t("recentImports.status.failed")}
                            </Badge>
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
                          {formatDate(imp.startedAt, t("never"))}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
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
