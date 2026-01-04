"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect, useState } from "react";
import { format } from "date-fns";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Sparkles,
  Trash2,
  Pencil,
  Loader2,
  Eye,
  EyeOff,
  Calendar,
  Users,
  Upload,
  FileJson,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ConfirmationDialog,
  useConfirmation,
} from "@/components/ui/confirmation-dialog";
import { useTranslations } from "next-intl";
import { AdminClientPagination, AdminClientSearch, AdminClientSortHeader } from "@/components/admin";
import { useMemo } from "react";

interface Announcement {
  id: string;
  titleEn: string;
  titleNl: string;
  bodyEn: string;
  bodyNl: string;
  imageUrl: string | null;
  ctaLabel: string | null;
  ctaUrl: string | null;
  targetTiers: string[];
  publishedAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  isReleaseNote: boolean;
  createdAt: string;
  _count?: { dismissals: number };
}

const defaultFormData = {
  titleEn: "",
  titleNl: "",
  bodyEn: "",
  bodyNl: "",
  imageUrl: "",
  ctaLabel: "",
  ctaUrl: "",
  targetTiers: ["FREE", "PREMIUM", "FAMILY"] as string[],
  publishedAt: "",
  expiresAt: "",
  isActive: true,
  isReleaseNote: false,
};

export default function AnnouncementsPage() {
  const t = useTranslations("admin.announcements");
  const tConfirmations = useTranslations("confirmations");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(defaultFormData);

  const { confirm, dialogProps } = useConfirmation();

  // Import dialog state
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    total: number;
    imported: number;
    failed: number;
    errors: { index: number; error: string }[];
  } | null>(null);

  // Import preview state
  const [importDialogMode, setImportDialogMode] = useState<"input" | "preview">(
    "input"
  );
  const [importPreviewLocale, setImportPreviewLocale] = useState<"en" | "nl">(
    "en"
  );
  const [importPreviewIndex, setImportPreviewIndex] = useState(0);
  const [parsedAnnouncements, setParsedAnnouncements] = useState<
    Array<{
      titleEn: string;
      titleNl: string;
      bodyEn: string;
      bodyNl: string;
      imageUrl?: string | null;
      ctaLabel?: string | null;
      ctaUrl?: string | null;
      targetTiers?: string[];
      publishedAt?: string | null;
      expiresAt?: string | null;
      isActive?: boolean;
    }>
  >([]);
  const [parseError, setParseError] = useState<string | null>(null);

  // Preview state
  const [dialogMode, setDialogMode] = useState<"edit" | "preview">("edit");
  const [previewLocale, setPreviewLocale] = useState<"en" | "nl">("en");

  // Filtering, sorting, and pagination state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "scheduled" | "expired">("all");

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch("/api/admin/announcements");
      const data = await response.json();
      setAnnouncements(data);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { component: "AnnouncementsPage", action: "fetchAnnouncements" },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingId(null);
    setFormData(defaultFormData);
    setDialogMode("edit");
    setIsDialogOpen(true);
  };

  const openEditDialog = (announcement: Announcement) => {
    setEditingId(announcement.id);
    setFormData({
      titleEn: announcement.titleEn,
      titleNl: announcement.titleNl,
      bodyEn: announcement.bodyEn,
      bodyNl: announcement.bodyNl,
      imageUrl: announcement.imageUrl || "",
      ctaLabel: announcement.ctaLabel || "",
      ctaUrl: announcement.ctaUrl || "",
      targetTiers: announcement.targetTiers,
      publishedAt: announcement.publishedAt
        ? format(new Date(announcement.publishedAt), "yyyy-MM-dd'T'HH:mm")
        : "",
      expiresAt: announcement.expiresAt
        ? format(new Date(announcement.expiresAt), "yyyy-MM-dd'T'HH:mm")
        : "",
      isActive: announcement.isActive,
      isReleaseNote: announcement.isReleaseNote,
    });
    setDialogMode("edit");
    setIsDialogOpen(true);
  };

  const saveAnnouncement = async () => {
    setIsSaving(true);
    try {
      const payload = {
        titleEn: formData.titleEn,
        titleNl: formData.titleNl,
        bodyEn: formData.bodyEn,
        bodyNl: formData.bodyNl,
        imageUrl: formData.imageUrl || null,
        ctaLabel: formData.ctaLabel || null,
        ctaUrl: formData.ctaUrl || null,
        targetTiers: formData.targetTiers,
        publishedAt: formData.publishedAt
          ? new Date(formData.publishedAt).toISOString()
          : null,
        expiresAt: formData.expiresAt
          ? new Date(formData.expiresAt).toISOString()
          : null,
        isActive: formData.isActive,
        isReleaseNote: formData.isReleaseNote,
      };

      const url = editingId
        ? `/api/admin/announcements/${editingId}`
        : "/api/admin/announcements";
      const method = editingId ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setIsDialogOpen(false);
        setFormData(defaultFormData);
        setEditingId(null);
        fetchAnnouncements();
      } else {
        const error = await response.json();
        alert(error.error || t("errors.saveFailed"));
      }
    } catch (error) {
      Sentry.captureException(error, {
        tags: { component: "AnnouncementsPage", action: "saveAnnouncement" },
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleAnnouncement = async (announcement: Announcement) => {
    try {
      await fetch(`/api/admin/announcements/${announcement.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !announcement.isActive }),
      });
      fetchAnnouncements();
    } catch (error) {
      Sentry.captureException(error, {
        tags: { component: "AnnouncementsPage", action: "toggleAnnouncement" },
      });
    }
  };

  const deleteAnnouncement = (announcement: Announcement) => {
    const doDelete = async () => {
      try {
        await fetch(`/api/admin/announcements/${announcement.id}`, {
          method: "DELETE",
        });
        fetchAnnouncements();
      } catch (error) {
        Sentry.captureException(error, {
          tags: { component: "AnnouncementsPage", action: "deleteAnnouncement" },
        });
      }
    };

    confirm({
      title: t("deleteConfirm.title"),
      description: t("deleteConfirm.description", {
        title: announcement.titleEn,
      }),
      confirmText: tConfirmations("delete"),
      cancelText: tConfirmations("cancel"),
      variant: "destructive",
      onConfirm: doDelete,
    });
  };

  const handleTierChange = (tier: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      targetTiers: checked
        ? [...prev.targetTiers, tier]
        : prev.targetTiers.filter((t) => t !== tier),
    }));
  };

  const openImportDialog = () => {
    setImportJson("");
    setImportResult(null);
    setImportDialogMode("input");
    setParsedAnnouncements([]);
    setParseError(null);
    setImportPreviewIndex(0);
    setIsImportDialogOpen(true);
  };

  const parseImportJson = () => {
    try {
      const parsed = JSON.parse(importJson);
      const announcements = Array.isArray(parsed)
        ? parsed
        : parsed.announcements;

      if (!Array.isArray(announcements) || announcements.length === 0) {
        setParseError(t("import.errors.noAnnouncements"));
        return;
      }

      // Validate required fields
      const validationErrors: string[] = [];
      announcements.forEach((a, idx) => {
        if (!a.titleEn || !a.titleNl || !a.bodyEn || !a.bodyNl) {
          validationErrors.push(
            t("import.errors.missingFields", { index: idx })
          );
        }
      });

      if (validationErrors.length > 0) {
        setParseError(validationErrors.join("\n"));
        return;
      }

      setParsedAnnouncements(announcements);
      setParseError(null);
      setImportPreviewIndex(0);
      setImportDialogMode("preview");
    } catch {
      setParseError(t("import.errors.invalidJson"));
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    setImportResult(null);

    try {
      const parsed = JSON.parse(importJson);
      const payload = Array.isArray(parsed)
        ? { announcements: parsed }
        : parsed;

      const response = await fetch("/api/admin/announcements/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok && !result.total) {
        setImportResult({
          total: 0,
          imported: 0,
          failed: 1,
          errors: [{ index: 0, error: result.error || t("import.errors.importFailed") }],
        });
      } else {
        setImportResult(result);
        if (result.imported > 0) {
          fetchAnnouncements();
        }
      }
    } catch (error) {
      setImportResult({
        total: 0,
        imported: 0,
        failed: 1,
        errors: [
          {
            index: 0,
            error:
              error instanceof SyntaxError
                ? t("import.errors.invalidJson")
                : t("import.errors.importFailed"),
          },
        ],
      });
    } finally {
      setIsImporting(false);
    }
  };

  const getStatus = (announcement: Announcement) => {
    if (!announcement.isActive) return "inactive";
    const now = new Date();
    if (announcement.publishedAt && new Date(announcement.publishedAt) > now)
      return "scheduled";
    if (announcement.expiresAt && new Date(announcement.expiresAt) < now)
      return "expired";
    return "active";
  };

  const activeAnnouncements = announcements.filter(
    (a) => getStatus(a) === "active"
  );
  const totalDismissals = announcements.reduce(
    (acc, a) => acc + (a._count?.dismissals || 0),
    0
  );

  // Filter and sort announcements
  const filteredAndSortedAnnouncements = useMemo(() => {
    let filtered = announcements;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.titleEn.toLowerCase().includes(query) ||
          a.titleNl.toLowerCase().includes(query) ||
          a.bodyEn.toLowerCase().includes(query) ||
          a.bodyNl.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((a) => getStatus(a) === statusFilter);
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sortKey === "titleEn") {
        comparison = a.titleEn.localeCompare(b.titleEn);
      } else if (sortKey === "dismissals") {
        comparison = (a._count?.dismissals || 0) - (b._count?.dismissals || 0);
      } else if (sortKey === "status") {
        comparison = getStatus(a).localeCompare(getStatus(b));
      } else if (sortKey === "publishedAt") {
        const aDate = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const bDate = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        comparison = aDate - bDate;
      } else {
        // Default: createdAt
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [announcements, searchQuery, statusFilter, sortKey, sortOrder]);

  // Paginate
  const totalPages = Math.ceil(filteredAndSortedAnnouncements.length / perPage);
  const paginatedAnnouncements = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredAndSortedAnnouncements.slice(start, start + perPage);
  }, [filteredAndSortedAnnouncements, currentPage, perPage]);

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

  const handleStatusFilter = (status: "all" | "active" | "inactive" | "scheduled" | "expired") => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handlePerPageChange = (value: number) => {
    setPerPage(value);
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openImportDialog}>
            <Upload className="mr-2 h-4 w-4" />
            {t("import.button")}
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            {t("newAnnouncement")}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription>{t("stats.totalAnnouncements")}</CardDescription>
            <CardTitle className="text-2xl">{announcements.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription>{t("stats.activeNow")}</CardDescription>
            <CardTitle className="text-2xl">
              {activeAnnouncements.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription>{t("stats.totalDismissals")}</CardDescription>
            <CardTitle className="text-2xl">{totalDismissals}</CardTitle>
          </CardHeader>
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
              variant={statusFilter === "all" ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-sm"
              onClick={() => handleStatusFilter("all")}
            >
              {t("filters.all")} ({announcements.length})
            </Badge>
            <Badge
              variant={statusFilter === "active" ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-sm bg-green-500/10 hover:bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30"
              onClick={() => handleStatusFilter("active")}
            >
              <Eye className="h-3 w-3 mr-1" />
              {t("status.active")} ({activeAnnouncements.length})
            </Badge>
            <Badge
              variant={statusFilter === "scheduled" ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-sm bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30"
              onClick={() => handleStatusFilter("scheduled")}
            >
              <Calendar className="h-3 w-3 mr-1" />
              {t("status.scheduled")} ({announcements.filter((a) => getStatus(a) === "scheduled").length})
            </Badge>
            <Badge
              variant={statusFilter === "inactive" ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-sm"
              onClick={() => handleStatusFilter("inactive")}
            >
              <EyeOff className="h-3 w-3 mr-1" />
              {t("status.inactive")} ({announcements.filter((a) => getStatus(a) === "inactive").length})
            </Badge>
          </div>
        </div>
        {/* Sort options */}
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted-foreground">{t("sortBy")}:</span>
          <AdminClientSortHeader
            label={t("sortOptions.createdAt")}
            sortKey="createdAt"
            currentSort={sortKey}
            currentOrder={sortOrder}
            onSort={handleSort}
          />
          <AdminClientSortHeader
            label={t("sortOptions.title")}
            sortKey="titleEn"
            currentSort={sortKey}
            currentOrder={sortOrder}
            onSort={handleSort}
          />
          <AdminClientSortHeader
            label={t("sortOptions.publishedAt")}
            sortKey="publishedAt"
            currentSort={sortKey}
            currentOrder={sortOrder}
            onSort={handleSort}
          />
          <AdminClientSortHeader
            label={t("sortOptions.dismissals")}
            sortKey="dismissals"
            currentSort={sortKey}
            currentOrder={sortOrder}
            onSort={handleSort}
          />
        </div>
      </div>

      {/* Announcements Table */}
      <Card className="border-0 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>{t("table.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {paginatedAnnouncements.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t("empty.title")}</p>
              <p className="text-sm">{t("empty.description")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table.headers.title")}</TableHead>
                  <TableHead>{t("table.headers.target")}</TableHead>
                  <TableHead>{t("table.headers.schedule")}</TableHead>
                  <TableHead>{t("table.headers.dismissals")}</TableHead>
                  <TableHead>{t("table.headers.status")}</TableHead>
                  <TableHead className="text-right">
                    {t("table.headers.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedAnnouncements.map((announcement) => {
                  const status = getStatus(announcement);
                  return (
                    <TableRow key={announcement.id}>
                      <TableCell>
                        <div className="max-w-xs">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">
                              {announcement.titleEn}
                            </p>
                            {announcement.isReleaseNote && (
                              <Badge variant="outline" className="shrink-0 text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100 border-purple-200 dark:border-purple-800">
                                <Megaphone className="h-3 w-3 mr-1" />
                                {t("releaseNote")}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {announcement.titleNl}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {announcement.targetTiers.map((tier) => (
                            <Badge
                              key={tier}
                              variant="outline"
                              className="text-xs"
                            >
                              {tier}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs">
                          {announcement.publishedAt && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(
                                new Date(announcement.publishedAt),
                                "MMM d, yyyy"
                              )}
                            </div>
                          )}
                          {announcement.expiresAt && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              → {format(new Date(announcement.expiresAt), "MMM d")}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {announcement._count?.dismissals || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={status === "active" ? "default" : "secondary"}
                          className={cn(
                            status === "active" &&
                              "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
                            status === "scheduled" &&
                              "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
                            status === "expired" &&
                              "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
                          )}
                        >
                          {status === "active" && <Eye className="h-3 w-3 mr-1" />}
                          {status === "inactive" && (
                            <EyeOff className="h-3 w-3 mr-1" />
                          )}
                          {t(`status.${status}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Switch
                            checked={announcement.isActive}
                            onCheckedChange={() =>
                              toggleAnnouncement(announcement)
                            }
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditDialog(announcement)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600"
                            onClick={() => deleteAnnouncement(announcement)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {filteredAndSortedAnnouncements.length > 0 && (
            <div className="mt-4">
              <AdminClientPagination
                page={currentPage}
                totalPages={totalPages}
                total={filteredAndSortedAnnouncements.length}
                perPage={perPage}
                onPageChange={setCurrentPage}
                onPerPageChange={handlePerPageChange}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? t("dialog.editTitle") : t("dialog.createTitle")}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? t("dialog.editDescription")
                : t("dialog.createDescription")}
            </DialogDescription>
          </DialogHeader>

          {/* Edit/Preview Mode Toggle */}
          <div className="flex items-center justify-between border-b pb-4">
            <Tabs
              value={dialogMode}
              onValueChange={(v) => setDialogMode(v as "edit" | "preview")}
            >
              <TabsList>
                <TabsTrigger value="edit" className="gap-2">
                  <Pencil className="h-4 w-4" />
                  {t("dialog.modes.edit")}
                </TabsTrigger>
                <TabsTrigger
                  value="preview"
                  className="gap-2"
                  disabled={
                    !formData.titleEn ||
                    !formData.titleNl ||
                    !formData.bodyEn ||
                    !formData.bodyNl
                  }
                >
                  <Eye className="h-4 w-4" />
                  {t("dialog.modes.preview")}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {dialogMode === "preview" && (
              <Tabs
                value={previewLocale}
                onValueChange={(v) => setPreviewLocale(v as "en" | "nl")}
              >
                <TabsList>
                  <TabsTrigger value="en">EN</TabsTrigger>
                  <TabsTrigger value="nl">NL</TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          </div>

          {dialogMode === "edit" ? (
            <>
              <Tabs defaultValue="en" className="mt-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="en">
                    {t("dialog.tabs.english")}
                  </TabsTrigger>
                  <TabsTrigger value="nl">{t("dialog.tabs.dutch")}</TabsTrigger>
                </TabsList>

                <TabsContent value="en" className="space-y-4 mt-4">
                  <div className="grid gap-2">
                    <Label htmlFor="titleEn">
                      {t("dialog.fields.titleEn")}
                    </Label>
                    <Input
                      id="titleEn"
                      value={formData.titleEn}
                      onChange={(e) =>
                        setFormData({ ...formData, titleEn: e.target.value })
                      }
                      placeholder={t("dialog.fields.titleEnPlaceholder")}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="bodyEn">{t("dialog.fields.bodyEn")}</Label>
                    <Textarea
                      id="bodyEn"
                      value={formData.bodyEn}
                      onChange={(e) =>
                        setFormData({ ...formData, bodyEn: e.target.value })
                      }
                      placeholder={t("dialog.fields.bodyEnPlaceholder")}
                      rows={4}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="nl" className="space-y-4 mt-4">
                  <div className="grid gap-2">
                    <Label htmlFor="titleNl">
                      {t("dialog.fields.titleNl")}
                    </Label>
                    <Input
                      id="titleNl"
                      value={formData.titleNl}
                      onChange={(e) =>
                        setFormData({ ...formData, titleNl: e.target.value })
                      }
                      placeholder={t("dialog.fields.titleNlPlaceholder")}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="bodyNl">{t("dialog.fields.bodyNl")}</Label>
                    <Textarea
                      id="bodyNl"
                      value={formData.bodyNl}
                      onChange={(e) =>
                        setFormData({ ...formData, bodyNl: e.target.value })
                      }
                      placeholder={t("dialog.fields.bodyNlPlaceholder")}
                      rows={4}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="space-y-4 mt-4">
                <div className="grid gap-2">
                  <Label htmlFor="imageUrl">
                    {t("dialog.fields.imageUrl")}
                  </Label>
                  <Input
                    id="imageUrl"
                    value={formData.imageUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, imageUrl: e.target.value })
                    }
                    placeholder={t("dialog.fields.imageUrlPlaceholder")}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="ctaLabel">
                      {t("dialog.fields.ctaLabel")}
                    </Label>
                    <Input
                      id="ctaLabel"
                      value={formData.ctaLabel}
                      onChange={(e) =>
                        setFormData({ ...formData, ctaLabel: e.target.value })
                      }
                      placeholder={t("dialog.fields.ctaLabelPlaceholder")}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="ctaUrl">{t("dialog.fields.ctaUrl")}</Label>
                    <Input
                      id="ctaUrl"
                      value={formData.ctaUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, ctaUrl: e.target.value })
                      }
                      placeholder={t("dialog.fields.ctaUrlPlaceholder")}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>{t("dialog.fields.targetTiers")}</Label>
                  <div className="flex gap-4">
                    {["FREE", "PREMIUM", "FAMILY"].map((tier) => (
                      <div key={tier} className="flex items-center space-x-2">
                        <Checkbox
                          id={`tier-${tier}`}
                          checked={formData.targetTiers.includes(tier)}
                          onCheckedChange={(
                            checked: boolean | "indeterminate"
                          ) => handleTierChange(tier, checked === true)}
                        />
                        <Label
                          htmlFor={`tier-${tier}`}
                          className="text-sm font-normal"
                        >
                          {tier}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="publishedAt">
                      {t("dialog.fields.publishDate")}
                    </Label>
                    <Input
                      id="publishedAt"
                      type="datetime-local"
                      value={formData.publishedAt}
                      onChange={(e) =>
                        setFormData({ ...formData, publishedAt: e.target.value })
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("dialog.fields.publishDateHint")}
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="expiresAt">
                      {t("dialog.fields.expiryDate")}
                    </Label>
                    <Input
                      id="expiresAt"
                      type="datetime-local"
                      value={formData.expiresAt}
                      onChange={(e) =>
                        setFormData({ ...formData, expiresAt: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isActive: checked })
                    }
                  />
                  <Label htmlFor="isActive">{t("dialog.fields.active")}</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isReleaseNote"
                    checked={formData.isReleaseNote}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isReleaseNote: checked })
                    }
                  />
                  <Label htmlFor="isReleaseNote" className="flex items-center gap-2">
                    <Megaphone className="h-4 w-4" />
                    {t("dialog.fields.releaseNote")}
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground -mt-2 ml-11">
                  {t("dialog.fields.releaseNoteHint")}
                </p>
              </div>
            </>
          ) : (
            /* Preview Mode */
            <div className="mt-4">
              <div className="rounded-lg border bg-background p-6 shadow-lg">
                <div className="text-center sm:text-left">
                  <div className="mx-auto sm:mx-0 mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold">
                    {previewLocale === "nl"
                      ? formData.titleNl
                      : formData.titleEn}
                  </h3>
                </div>

                <div className="space-y-4 py-4">
                  {formData.imageUrl && (
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={formData.imageUrl}
                        alt={
                          previewLocale === "nl"
                            ? formData.titleNl
                            : formData.titleEn
                        }
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}

                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {previewLocale === "nl"
                        ? formData.bodyNl
                        : formData.bodyEn}
                    </p>
                  </div>

                  {formData.ctaUrl && (
                    <Button variant="link" className="px-0 h-auto" asChild>
                      <a
                        href={formData.ctaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1"
                      >
                        {formData.ctaLabel || t("dialog.preview.learnMore")}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  )}
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <Button disabled>{t("dialog.preview.gotIt")}</Button>
                </div>
              </div>

              {/* Preview metadata */}
              <div className="mt-4 p-4 rounded-lg bg-muted/50 space-y-2 text-sm">
                <p className="font-medium">{t("dialog.preview.metadata")}</p>
                <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                  <div>
                    {t("dialog.preview.targetTiers")}:{" "}
                    {formData.targetTiers.join(", ") || t("dialog.preview.none")}
                  </div>
                  <div>
                    {t("dialog.preview.status")}:{" "}
                    {formData.isActive
                      ? t("status.active")
                      : t("status.inactive")}
                  </div>
                  <div>
                    {t("dialog.fields.publishDate")}:{" "}
                    {formData.publishedAt
                      ? format(new Date(formData.publishedAt), "MMM d, yyyy HH:mm")
                      : t("dialog.preview.immediately")}
                  </div>
                  <div>
                    {t("dialog.fields.expiryDate")}:{" "}
                    {formData.expiresAt
                      ? format(new Date(formData.expiresAt), "MMM d, yyyy HH:mm")
                      : t("dialog.preview.never")}
                  </div>
                  <div className="col-span-2">
                    {t("dialog.fields.releaseNote")}:{" "}
                    {formData.isReleaseNote
                      ? t("dialog.preview.yes")
                      : t("dialog.preview.no")}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {t("dialog.buttons.cancel")}
            </Button>
            {dialogMode === "edit" && (
              <Button
                variant="outline"
                onClick={() => setDialogMode("preview")}
                disabled={
                  !formData.titleEn ||
                  !formData.titleNl ||
                  !formData.bodyEn ||
                  !formData.bodyNl
                }
              >
                <Eye className="mr-2 h-4 w-4" />
                {t("dialog.buttons.preview")}
              </Button>
            )}
            {dialogMode === "preview" && (
              <Button variant="outline" onClick={() => setDialogMode("edit")}>
                <Pencil className="mr-2 h-4 w-4" />
                {t("dialog.buttons.backToEdit")}
              </Button>
            )}
            <Button
              onClick={saveAnnouncement}
              disabled={
                isSaving ||
                !formData.titleEn ||
                !formData.titleNl ||
                !formData.bodyEn ||
                !formData.bodyNl
              }
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("dialog.buttons.saving")}
                </>
              ) : editingId ? (
                t("dialog.buttons.update")
              ) : (
                t("dialog.buttons.create")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileJson className="h-5 w-5" />
              {t("import.title")}
            </DialogTitle>
            <DialogDescription>{t("import.description")}</DialogDescription>
          </DialogHeader>

          {/* Mode Toggle for Import */}
          {!importResult && (
            <div className="flex items-center justify-between border-b pb-4">
              <Tabs
                value={importDialogMode}
                onValueChange={(v) =>
                  setImportDialogMode(v as "input" | "preview")
                }
              >
                <TabsList>
                  <TabsTrigger value="input" className="gap-2">
                    <FileJson className="h-4 w-4" />
                    {t("import.modes.input")}
                  </TabsTrigger>
                  <TabsTrigger
                    value="preview"
                    className="gap-2"
                    disabled={parsedAnnouncements.length === 0}
                  >
                    <Eye className="h-4 w-4" />
                    {t("import.modes.preview")}
                    {parsedAnnouncements.length > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {parsedAnnouncements.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {importDialogMode === "preview" && (
                <Tabs
                  value={importPreviewLocale}
                  onValueChange={(v) =>
                    setImportPreviewLocale(v as "en" | "nl")
                  }
                >
                  <TabsList>
                    <TabsTrigger value="en">EN</TabsTrigger>
                    <TabsTrigger value="nl">NL</TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
            </div>
          )}

          {importDialogMode === "input" ? (
            <div className="space-y-4 mt-4">
              <div className="grid gap-2">
                <Label htmlFor="importJson">{t("import.jsonInput")}</Label>
                <Textarea
                  id="importJson"
                  value={importJson}
                  onChange={(e) => {
                    setImportJson(e.target.value);
                    setParseError(null);
                  }}
                  placeholder={t("import.placeholder")}
                  rows={12}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  {t("import.hint")}
                </p>
              </div>

              {parseError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{t("import.errors.parseError")}</AlertTitle>
                  <AlertDescription className="whitespace-pre-wrap">
                    {parseError}
                  </AlertDescription>
                </Alert>
              )}

              {importResult && (
                <Alert
                  variant={importResult.failed > 0 ? "destructive" : "default"}
                  className={
                    importResult.failed === 0
                      ? "border-green-500 bg-green-50 dark:bg-green-950"
                      : undefined
                  }
                >
                  {importResult.failed > 0 ? (
                    <AlertCircle className="h-4 w-4" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                  <AlertTitle>
                    {importResult.failed > 0
                      ? t("import.resultPartial")
                      : t("import.resultSuccess")}
                  </AlertTitle>
                  <AlertDescription>
                    <p>
                      {t("import.resultStats", {
                        imported: importResult.imported,
                        total: importResult.total,
                      })}
                    </p>
                    {importResult.errors.length > 0 && (
                      <ul className="mt-2 list-disc list-inside text-sm">
                        {importResult.errors.map((err, idx) => (
                          <li key={idx}>
                            {t("import.errorAtIndex", { index: err.index })}:{" "}
                            {err.error}
                          </li>
                        ))}
                      </ul>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            /* Import Preview Mode */
            <div className="mt-4">
              {parsedAnnouncements.length > 0 && (
                <>
                  {/* Navigation for multiple announcements */}
                  {parsedAnnouncements.length > 1 && (
                    <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-muted/50">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          setImportPreviewIndex((prev) =>
                            Math.max(0, prev - 1)
                          )
                        }
                        disabled={importPreviewIndex === 0}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {t("import.preview.announcementOf", {
                            current: importPreviewIndex + 1,
                            total: parsedAnnouncements.length,
                          })}
                        </span>
                        <div className="flex gap-1">
                          {parsedAnnouncements.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setImportPreviewIndex(idx)}
                              className={cn(
                                "h-2 w-2 rounded-full transition-colors",
                                idx === importPreviewIndex
                                  ? "bg-primary"
                                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                              )}
                            />
                          ))}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          setImportPreviewIndex((prev) =>
                            Math.min(parsedAnnouncements.length - 1, prev + 1)
                          )
                        }
                        disabled={
                          importPreviewIndex === parsedAnnouncements.length - 1
                        }
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {/* Preview Card */}
                  {(() => {
                    const currentAnnouncement =
                      parsedAnnouncements[importPreviewIndex];
                    return (
                      <div className="rounded-lg border bg-background p-6 shadow-lg">
                        <div className="text-center sm:text-left">
                          <div className="mx-auto sm:mx-0 mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                            <Sparkles className="h-6 w-6" />
                          </div>
                          <h3 className="text-xl font-semibold">
                            {importPreviewLocale === "nl"
                              ? currentAnnouncement.titleNl
                              : currentAnnouncement.titleEn}
                          </h3>
                        </div>

                        <div className="space-y-4 py-4">
                          {currentAnnouncement.imageUrl && (
                            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={currentAnnouncement.imageUrl}
                                alt={
                                  importPreviewLocale === "nl"
                                    ? currentAnnouncement.titleNl
                                    : currentAnnouncement.titleEn
                                }
                                className="object-cover w-full h-full"
                                onError={(e) => {
                                  (
                                    e.target as HTMLImageElement
                                  ).style.display = "none";
                                }}
                              />
                            </div>
                          )}

                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <p className="text-muted-foreground whitespace-pre-wrap">
                              {importPreviewLocale === "nl"
                                ? currentAnnouncement.bodyNl
                                : currentAnnouncement.bodyEn}
                            </p>
                          </div>

                          {currentAnnouncement.ctaUrl && (
                            <Button
                              variant="link"
                              className="px-0 h-auto"
                              asChild
                            >
                              <a
                                href={currentAnnouncement.ctaUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1"
                              >
                                {currentAnnouncement.ctaLabel ||
                                  t("dialog.preview.learnMore")}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </Button>
                          )}
                        </div>

                        <div className="flex justify-end pt-4 border-t">
                          <Button disabled>{t("dialog.preview.gotIt")}</Button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Preview metadata */}
                  {(() => {
                    const currentAnnouncement =
                      parsedAnnouncements[importPreviewIndex];
                    return (
                      <div className="mt-4 p-4 rounded-lg bg-muted/50 space-y-2 text-sm">
                        <p className="font-medium">
                          {t("dialog.preview.metadata")}
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                          <div>
                            {t("dialog.preview.targetTiers")}:{" "}
                            {currentAnnouncement.targetTiers?.join(", ") ||
                              "FREE, PREMIUM, FAMILY"}
                          </div>
                          <div>
                            {t("dialog.preview.status")}:{" "}
                            {currentAnnouncement.isActive !== false
                              ? t("status.active")
                              : t("status.inactive")}
                          </div>
                          <div>
                            {t("dialog.fields.publishDate")}:{" "}
                            {currentAnnouncement.publishedAt
                              ? format(
                                  new Date(currentAnnouncement.publishedAt),
                                  "MMM d, yyyy HH:mm"
                                )
                              : t("dialog.preview.immediately")}
                          </div>
                          <div>
                            {t("dialog.fields.expiryDate")}:{" "}
                            {currentAnnouncement.expiresAt
                              ? format(
                                  new Date(currentAnnouncement.expiresAt),
                                  "MMM d, yyyy HH:mm"
                                )
                              : t("dialog.preview.never")}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          )}

          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setIsImportDialogOpen(false)}
            >
              {importResult?.imported
                ? t("import.close")
                : t("dialog.buttons.cancel")}
            </Button>
            {!importResult?.imported && importDialogMode === "input" && (
              <Button
                variant="outline"
                onClick={parseImportJson}
                disabled={!importJson.trim()}
              >
                <Eye className="mr-2 h-4 w-4" />
                {t("import.previewButton")}
              </Button>
            )}
            {!importResult?.imported && importDialogMode === "preview" && (
              <Button
                variant="outline"
                onClick={() => setImportDialogMode("input")}
              >
                <Pencil className="mr-2 h-4 w-4" />
                {t("import.backToInput")}
              </Button>
            )}
            {!importResult?.imported && (
              <Button
                onClick={handleImport}
                disabled={isImporting || !importJson.trim()}
              >
                {isImporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("import.importing")}
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    {t("import.importButton")}
                    {parsedAnnouncements.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {parsedAnnouncements.length}
                      </Badge>
                    )}
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog {...dialogProps} />
    </div>
  );
}
