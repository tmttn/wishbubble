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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Trash2,
  Pencil,
  Loader2,
  Eye,
  EyeOff,
  BookOpen,
  Calendar,
  DollarSign,
  Users,
  Tag,
  Search,
  Settings,
  FileText,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ConfirmationDialog,
  useConfirmation,
} from "@/components/ui/confirmation-dialog";
import { useTranslations } from "next-intl";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { ImageUpload } from "@/components/ui/image-upload";
import { useMemo } from "react";
import { AdminClientPagination, AdminClientSearch, AdminClientSortHeader } from "@/components/admin";

interface GiftGuide {
  id: string;
  slug: string;
  titleEn: string;
  titleNl: string;
  descriptionEn: string;
  descriptionNl: string;
  contentEn: string;
  contentNl: string;
  metaTitleEn: string | null;
  metaTitleNl: string | null;
  metaDescriptionEn: string | null;
  metaDescriptionNl: string | null;
  keywordsEn: string[];
  keywordsNl: string[];
  canonicalUrl: string | null;
  ogImageEn: string | null;
  ogImageNl: string | null;
  noIndex: boolean;
  noFollow: boolean;
  category: string | null;
  priceMin: number | null;
  priceMax: number | null;
  searchQuery: string | null;
  featuredImage: string | null;
  sortOrder: number;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const defaultFormData = {
  slug: "",
  titleEn: "",
  titleNl: "",
  descriptionEn: "",
  descriptionNl: "",
  contentEn: "",
  contentNl: "",
  metaTitleEn: "",
  metaTitleNl: "",
  metaDescriptionEn: "",
  metaDescriptionNl: "",
  keywordsEn: "",
  keywordsNl: "",
  canonicalUrl: "",
  ogImageEn: "",
  ogImageNl: "",
  noIndex: false,
  noFollow: false,
  category: "" as string,
  priceMin: "",
  priceMax: "",
  searchQuery: "",
  featuredImage: "",
  sortOrder: "0",
  isPublished: false,
  publishedAt: "",
};

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100);
}

export default function GiftGuidesPage() {
  const t = useTranslations("admin.giftGuides");
  const tCommon = useTranslations("admin.common");
  const tConfirmations = useTranslations("confirmations");
  const [guides, setGuides] = useState<GiftGuide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(defaultFormData);

  // Filtering, sorting, pagination state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<string>("sortOrder");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [categoryFilter, setCategoryFilter] = useState<"all" | "occasion" | "budget" | "recipient" | "uncategorized">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");

  const { confirm, dialogProps } = useConfirmation();

  // Dialog state
  const [dialogMode, setDialogMode] = useState<"edit" | "preview">("edit");
  const [previewLocale, setPreviewLocale] = useState<"en" | "nl">("en");
  const [activeTab, setActiveTab] = useState<"content" | "seo" | "filtering" | "settings">("content");
  // Single global language toggle for the form
  const [formLocale, setFormLocale] = useState<"en" | "nl">("en");

  useEffect(() => {
    fetchGuides();
  }, []);

  const fetchGuides = async () => {
    try {
      const response = await fetch("/api/admin/gift-guides");
      const data = await response.json();
      setGuides(data);
    } catch (error) {
      Sentry.captureException(error, {
        tags: { component: "GiftGuidesPage", action: "fetchGuides" },
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filtered and sorted guides
  const filteredAndSortedGuides = useMemo(() => {
    let result = [...guides];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (guide) =>
          guide.titleEn.toLowerCase().includes(query) ||
          guide.titleNl.toLowerCase().includes(query) ||
          guide.slug.toLowerCase().includes(query) ||
          guide.descriptionEn.toLowerCase().includes(query) ||
          guide.descriptionNl.toLowerCase().includes(query)
      );
    }

    if (categoryFilter !== "all") {
      if (categoryFilter === "uncategorized") {
        result = result.filter((guide) => !guide.category);
      } else {
        result = result.filter((guide) => guide.category === categoryFilter);
      }
    }

    if (statusFilter !== "all") {
      result = result.filter((guide) =>
        statusFilter === "published" ? guide.isPublished : !guide.isPublished
      );
    }

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortKey) {
        case "sortOrder":
          comparison = a.sortOrder - b.sortOrder;
          break;
        case "titleEn":
          comparison = a.titleEn.localeCompare(b.titleEn);
          break;
        case "category":
          comparison = (a.category || "").localeCompare(b.category || "");
          break;
        case "createdAt":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case "updatedAt":
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        default:
          comparison = 0;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [guides, searchQuery, categoryFilter, statusFilter, sortKey, sortOrder]);

  const paginatedGuides = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredAndSortedGuides.slice(start, start + perPage);
  }, [filteredAndSortedGuides, currentPage, perPage]);

  const totalPages = Math.ceil(filteredAndSortedGuides.length / perPage);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleSort = (key: string, order: "asc" | "desc") => {
    setSortKey(key);
    setSortOrder(order);
    setCurrentPage(1);
  };

  const handleCategoryFilter = (value: string) => {
    setCategoryFilter(value as typeof categoryFilter);
    setCurrentPage(1);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value as typeof statusFilter);
    setCurrentPage(1);
  };

  const handlePerPageChange = (value: number) => {
    setPerPage(value);
    setCurrentPage(1);
  };

  const openCreateDialog = () => {
    setEditingId(null);
    setFormData(defaultFormData);
    setDialogMode("edit");
    setActiveTab("content");
    setFormLocale("en");
    setIsDialogOpen(true);
  };

  const openEditDialog = (guide: GiftGuide) => {
    setEditingId(guide.id);
    setFormData({
      slug: guide.slug,
      titleEn: guide.titleEn,
      titleNl: guide.titleNl,
      descriptionEn: guide.descriptionEn,
      descriptionNl: guide.descriptionNl,
      contentEn: guide.contentEn,
      contentNl: guide.contentNl,
      metaTitleEn: guide.metaTitleEn || "",
      metaTitleNl: guide.metaTitleNl || "",
      metaDescriptionEn: guide.metaDescriptionEn || "",
      metaDescriptionNl: guide.metaDescriptionNl || "",
      keywordsEn: guide.keywordsEn.join(", "),
      keywordsNl: guide.keywordsNl.join(", "),
      canonicalUrl: guide.canonicalUrl || "",
      ogImageEn: guide.ogImageEn || "",
      ogImageNl: guide.ogImageNl || "",
      noIndex: guide.noIndex,
      noFollow: guide.noFollow,
      category: guide.category || "",
      priceMin: guide.priceMin?.toString() || "",
      priceMax: guide.priceMax?.toString() || "",
      searchQuery: guide.searchQuery || "",
      featuredImage: guide.featuredImage || "",
      sortOrder: guide.sortOrder.toString(),
      isPublished: guide.isPublished,
      publishedAt: guide.publishedAt
        ? format(new Date(guide.publishedAt), "yyyy-MM-dd'T'HH:mm")
        : "",
    });
    setDialogMode("edit");
    setActiveTab("content");
    setFormLocale("en");
    setIsDialogOpen(true);
  };

  const saveGuide = async () => {
    setIsSaving(true);
    try {
      const parseKeywords = (str: string): string[] =>
        str
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean);

      const payload = {
        slug: formData.slug,
        titleEn: formData.titleEn,
        titleNl: formData.titleNl,
        descriptionEn: formData.descriptionEn,
        descriptionNl: formData.descriptionNl,
        contentEn: formData.contentEn,
        contentNl: formData.contentNl,
        metaTitleEn: formData.metaTitleEn || null,
        metaTitleNl: formData.metaTitleNl || null,
        metaDescriptionEn: formData.metaDescriptionEn || null,
        metaDescriptionNl: formData.metaDescriptionNl || null,
        keywordsEn: parseKeywords(formData.keywordsEn),
        keywordsNl: parseKeywords(formData.keywordsNl),
        canonicalUrl: formData.canonicalUrl || null,
        ogImageEn: formData.ogImageEn || null,
        ogImageNl: formData.ogImageNl || null,
        noIndex: formData.noIndex,
        noFollow: formData.noFollow,
        category: formData.category || null,
        priceMin: formData.priceMin ? parseFloat(formData.priceMin) : null,
        priceMax: formData.priceMax ? parseFloat(formData.priceMax) : null,
        searchQuery: formData.searchQuery || null,
        featuredImage: formData.featuredImage || null,
        sortOrder: parseInt(formData.sortOrder) || 0,
        isPublished: formData.isPublished,
        publishedAt: formData.publishedAt
          ? new Date(formData.publishedAt).toISOString()
          : null,
      };

      const url = editingId
        ? `/api/admin/gift-guides/${editingId}`
        : "/api/admin/gift-guides";
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
        fetchGuides();
      } else {
        const error = await response.json();
        alert(error.error || t("errors.saveFailed"));
      }
    } catch (error) {
      Sentry.captureException(error, {
        tags: { component: "GiftGuidesPage", action: "saveGuide" },
      });
    } finally {
      setIsSaving(false);
    }
  };

  const togglePublished = async (guide: GiftGuide) => {
    try {
      await fetch(`/api/admin/gift-guides/${guide.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !guide.isPublished }),
      });
      fetchGuides();
    } catch (error) {
      Sentry.captureException(error, {
        tags: { component: "GiftGuidesPage", action: "togglePublished" },
      });
    }
  };

  const deleteGuide = (guide: GiftGuide) => {
    const doDelete = async () => {
      try {
        await fetch(`/api/admin/gift-guides/${guide.id}`, {
          method: "DELETE",
        });
        fetchGuides();
      } catch (error) {
        Sentry.captureException(error, {
          tags: { component: "GiftGuidesPage", action: "deleteGuide" },
        });
      }
    };

    confirm({
      title: t("deleteConfirm.title"),
      description: t("deleteConfirm.description", { title: guide.titleEn }),
      confirmText: tConfirmations("delete"),
      cancelText: tConfirmations("cancel"),
      variant: "destructive",
      onConfirm: doDelete,
    });
  };

  const handleTitleChange = (value: string, locale: "en" | "nl") => {
    setFormData((prev) => {
      const updated = {
        ...prev,
        [locale === "en" ? "titleEn" : "titleNl"]: value,
      };
      if (locale === "en" && (!prev.slug || prev.slug === generateSlug(prev.titleEn))) {
        updated.slug = generateSlug(value);
      }
      return updated;
    });
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

  const publishedGuides = guides.filter((g) => g.isPublished);
  const byOccasion = guides.filter((g) => g.category === "occasion");
  const byBudget = guides.filter((g) => g.category === "budget");
  const byRecipient = guides.filter((g) => g.category === "recipient");

  const getCategoryIcon = (category: string | null) => {
    switch (category) {
      case "occasion":
        return <Calendar className="h-3 w-3" />;
      case "budget":
        return <DollarSign className="h-3 w-3" />;
      case "recipient":
        return <Users className="h-3 w-3" />;
      default:
        return <Tag className="h-3 w-3" />;
    }
  };

  const getCategoryLabel = (category: string | null) => {
    switch (category) {
      case "occasion":
        return t("categories.occasion");
      case "budget":
        return t("categories.budget");
      case "recipient":
        return t("categories.recipient");
      default:
        return t("categories.uncategorized");
    }
  };

  // Helper to get current locale value
  const getLocaleValue = (enKey: keyof typeof formData, nlKey: keyof typeof formData) => {
    return formLocale === "en" ? formData[enKey] : formData[nlKey];
  };

  // Helper to set current locale value
  const setLocaleValue = (enKey: keyof typeof formData, nlKey: keyof typeof formData, value: string) => {
    const key = formLocale === "en" ? enKey : nlKey;
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          {t("newGuide")}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription>{t("stats.total")}</CardDescription>
            <CardTitle className="text-2xl">{guides.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription>{t("stats.published")}</CardDescription>
            <CardTitle className="text-2xl">{publishedGuides.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription>{t("stats.byOccasion")}</CardDescription>
            <CardTitle className="text-2xl">{byOccasion.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription>{t("stats.byBudget")}</CardDescription>
            <CardTitle className="text-2xl">{byBudget.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardDescription>{t("stats.byRecipient")}</CardDescription>
            <CardTitle className="text-2xl">{byRecipient.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Guides Table */}
      <Card className="border-0 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>{t("table.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <AdminClientSearch
              value={searchQuery}
              onChange={handleSearch}
              placeholder={tCommon("searchPlaceholder")}
            />
            <Select value={categoryFilter} onValueChange={handleCategoryFilter}>
              <SelectTrigger className="w-[180px] bg-card/80 backdrop-blur-sm border-0">
                <SelectValue placeholder={t("filters.category")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filters.allCategories")}</SelectItem>
                <SelectItem value="occasion">{t("categories.occasion")}</SelectItem>
                <SelectItem value="budget">{t("categories.budget")}</SelectItem>
                <SelectItem value="recipient">{t("categories.recipient")}</SelectItem>
                <SelectItem value="uncategorized">{t("categories.uncategorized")}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-[150px] bg-card/80 backdrop-blur-sm border-0">
                <SelectValue placeholder={t("filters.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filters.allStatuses")}</SelectItem>
                <SelectItem value="published">{t("status.published")}</SelectItem>
                <SelectItem value="draft">{t("status.draft")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {guides.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t("empty.title")}</p>
              <p className="text-sm">{t("empty.description")}</p>
            </div>
          ) : paginatedGuides.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{tCommon("noResults")}</p>
              <p className="text-sm">{tCommon("noResultsDescription")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <AdminClientSortHeader
                      label={t("table.headers.title")}
                      sortKey="titleEn"
                      currentSort={sortKey}
                      currentOrder={sortOrder}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead>
                    <AdminClientSortHeader
                      label={t("table.headers.category")}
                      sortKey="category"
                      currentSort={sortKey}
                      currentOrder={sortOrder}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead>{t("table.headers.priceRange")}</TableHead>
                  <TableHead>
                    <AdminClientSortHeader
                      label={t("table.headers.order")}
                      sortKey="sortOrder"
                      currentSort={sortKey}
                      currentOrder={sortOrder}
                      onSort={handleSort}
                    />
                  </TableHead>
                  <TableHead>{t("table.headers.status")}</TableHead>
                  <TableHead className="text-right">
                    {t("table.headers.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedGuides.map((guide) => (
                  <TableRow key={guide.id}>
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="font-medium truncate">{guide.titleEn}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {guide.titleNl}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          /{guide.slug}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        {getCategoryIcon(guide.category)}
                        {getCategoryLabel(guide.category)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {guide.priceMin || guide.priceMax ? (
                        <span className="text-sm">
                          {guide.priceMin ? `€${guide.priceMin}` : "€0"}
                          {" - "}
                          {guide.priceMax ? `€${guide.priceMax}` : "∞"}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>{guide.sortOrder}</TableCell>
                    <TableCell>
                      <Badge
                        variant={guide.isPublished ? "default" : "secondary"}
                        className={cn(
                          guide.isPublished &&
                            "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                        )}
                      >
                        {guide.isPublished ? (
                          <Eye className="h-3 w-3 mr-1" />
                        ) : (
                          <EyeOff className="h-3 w-3 mr-1" />
                        )}
                        {guide.isPublished
                          ? t("status.published")
                          : t("status.draft")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Switch
                          checked={guide.isPublished}
                          onCheckedChange={() => togglePublished(guide)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(guide)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                          onClick={() => deleteGuide(guide)}
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

          {/* Pagination */}
          {filteredAndSortedGuides.length > 0 && (
            <AdminClientPagination
              page={currentPage}
              totalPages={totalPages}
              total={filteredAndSortedGuides.length}
              perPage={perPage}
              onPageChange={setCurrentPage}
              onPerPageChange={handlePerPageChange}
            />
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[1000px] max-h-[90vh] overflow-hidden flex flex-col">
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

          {/* Header with Edit/Preview toggle and Language selector */}
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
                    !formData.descriptionEn ||
                    !formData.descriptionNl
                  }
                >
                  <Eye className="h-4 w-4" />
                  {t("dialog.modes.preview")}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Single Global Language Toggle */}
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <Tabs
                value={dialogMode === "preview" ? previewLocale : formLocale}
                onValueChange={(v) => {
                  if (dialogMode === "preview") {
                    setPreviewLocale(v as "en" | "nl");
                  } else {
                    setFormLocale(v as "en" | "nl");
                  }
                }}
              >
                <TabsList>
                  <TabsTrigger value="en">EN</TabsTrigger>
                  <TabsTrigger value="nl">NL</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {dialogMode === "edit" ? (
            <div className="flex-1 overflow-hidden flex">
              {/* Left sidebar with tabs */}
              <div className="w-48 border-r pr-4 flex-shrink-0">
                <nav className="space-y-1">
                  <button
                    onClick={() => setActiveTab("content")}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
                      activeTab === "content"
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    <FileText className="h-4 w-4" />
                    {t("dialog.sections.content")}
                  </button>
                  <button
                    onClick={() => setActiveTab("seo")}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
                      activeTab === "seo"
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    <Globe className="h-4 w-4" />
                    {t("dialog.sections.seo")}
                  </button>
                  <button
                    onClick={() => setActiveTab("filtering")}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
                      activeTab === "filtering"
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    <Search className="h-4 w-4" />
                    {t("dialog.sections.products")}
                  </button>
                  <button
                    onClick={() => setActiveTab("settings")}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
                      activeTab === "settings"
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    <Settings className="h-4 w-4" />
                    {t("dialog.sections.display")}
                  </button>
                </nav>
              </div>

              {/* Right content area */}
              <div className="flex-1 pl-6 overflow-y-auto max-h-[calc(90vh-220px)]">
                {/* Content Tab */}
                {activeTab === "content" && (
                  <div className="space-y-6">
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="slug">{t("dialog.fields.slug")}</Label>
                        <Input
                          id="slug"
                          value={formData.slug}
                          onChange={(e) =>
                            setFormData({ ...formData, slug: e.target.value })
                          }
                          placeholder={t("dialog.fields.slugPlaceholder")}
                          className="font-mono"
                        />
                        <p className="text-xs text-muted-foreground">
                          {t("dialog.fields.slugHint")}
                        </p>
                      </div>

                      <div className="grid gap-2">
                        <Label>
                          {formLocale === "en" ? t("dialog.fields.titleEn") : t("dialog.fields.titleNl")}
                        </Label>
                        <Input
                          value={formLocale === "en" ? formData.titleEn : formData.titleNl}
                          onChange={(e) => handleTitleChange(e.target.value, formLocale)}
                          placeholder={formLocale === "en" ? t("dialog.fields.titleEnPlaceholder") : t("dialog.fields.titleNlPlaceholder")}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label>
                          {formLocale === "en" ? t("dialog.fields.descriptionEn") : t("dialog.fields.descriptionNl")}
                        </Label>
                        <Textarea
                          value={formLocale === "en" ? formData.descriptionEn : formData.descriptionNl}
                          onChange={(e) =>
                            setLocaleValue("descriptionEn", "descriptionNl", e.target.value)
                          }
                          placeholder={formLocale === "en" ? t("dialog.fields.descriptionEnPlaceholder") : t("dialog.fields.descriptionNlPlaceholder")}
                          rows={3}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label>
                          {formLocale === "en" ? t("dialog.fields.contentEn") : t("dialog.fields.contentNl")}
                        </Label>
                        <RichTextEditor
                          content={formLocale === "en" ? formData.contentEn : formData.contentNl}
                          onChange={(html) =>
                            setLocaleValue("contentEn", "contentNl", html)
                          }
                          placeholder={t("dialog.fields.contentPlaceholder")}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* SEO Tab */}
                {activeTab === "seo" && (
                  <div className="space-y-6">
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label>{t("dialog.fields.metaTitle")}</Label>
                        <Input
                          value={formLocale === "en" ? formData.metaTitleEn : formData.metaTitleNl}
                          onChange={(e) =>
                            setLocaleValue("metaTitleEn", "metaTitleNl", e.target.value)
                          }
                          placeholder={t("dialog.fields.metaTitlePlaceholder")}
                          maxLength={70}
                        />
                        <p className="text-xs text-muted-foreground flex justify-between">
                          <span>{t("dialog.fields.metaTitleHint")}</span>
                          <span>{(formLocale === "en" ? formData.metaTitleEn : formData.metaTitleNl).length}/70</span>
                        </p>
                      </div>

                      <div className="grid gap-2">
                        <Label>{t("dialog.fields.metaDescription")}</Label>
                        <Textarea
                          value={formLocale === "en" ? formData.metaDescriptionEn : formData.metaDescriptionNl}
                          onChange={(e) =>
                            setLocaleValue("metaDescriptionEn", "metaDescriptionNl", e.target.value)
                          }
                          placeholder={t("dialog.fields.metaDescriptionPlaceholder")}
                          maxLength={160}
                          rows={3}
                        />
                        <p className="text-xs text-muted-foreground flex justify-between">
                          <span>{t("dialog.fields.metaDescriptionHint")}</span>
                          <span>{(formLocale === "en" ? formData.metaDescriptionEn : formData.metaDescriptionNl).length}/160</span>
                        </p>
                      </div>

                      <div className="grid gap-2">
                        <Label>{t("dialog.fields.keywords")}</Label>
                        <Input
                          value={formLocale === "en" ? formData.keywordsEn : formData.keywordsNl}
                          onChange={(e) =>
                            setLocaleValue("keywordsEn", "keywordsNl", e.target.value)
                          }
                          placeholder={formLocale === "en" ? t("dialog.fields.keywordsEnPlaceholder") : t("dialog.fields.keywordsNlPlaceholder")}
                        />
                        <p className="text-xs text-muted-foreground">
                          {t("dialog.fields.keywordsHint")}
                        </p>
                      </div>

                      <div className="grid gap-2">
                        <Label>{t("dialog.fields.ogImage")}</Label>
                        <ImageUpload
                          value={(formLocale === "en" ? formData.ogImageEn : formData.ogImageNl) || null}
                          onChange={(url) =>
                            setLocaleValue("ogImageEn", "ogImageNl", url || "")
                          }
                        />
                        <p className="text-xs text-muted-foreground">
                          {t("dialog.fields.ogImageHint")}
                        </p>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="canonicalUrl">{t("dialog.fields.canonicalUrl")}</Label>
                        <Input
                          id="canonicalUrl"
                          value={formData.canonicalUrl}
                          onChange={(e) =>
                            setFormData({ ...formData, canonicalUrl: e.target.value })
                          }
                          placeholder={t("dialog.fields.canonicalUrlPlaceholder")}
                          type="url"
                        />
                        <p className="text-xs text-muted-foreground">
                          {t("dialog.fields.canonicalUrlHint")}
                        </p>
                      </div>

                      <div className="flex flex-col gap-4 pt-4 border-t">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>{t("dialog.fields.noIndex")}</Label>
                            <p className="text-xs text-muted-foreground">
                              {t("dialog.fields.noIndexHint")}
                            </p>
                          </div>
                          <Switch
                            checked={formData.noIndex}
                            onCheckedChange={(checked) =>
                              setFormData({ ...formData, noIndex: checked })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <Label>{t("dialog.fields.noFollow")}</Label>
                            <p className="text-xs text-muted-foreground">
                              {t("dialog.fields.noFollowHint")}
                            </p>
                          </div>
                          <Switch
                            checked={formData.noFollow}
                            onCheckedChange={(checked) =>
                              setFormData({ ...formData, noFollow: checked })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Product Filtering Tab */}
                {activeTab === "filtering" && (
                  <div className="space-y-6">
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="category">{t("dialog.fields.category")}</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) =>
                            setFormData({ ...formData, category: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t("dialog.fields.categoryPlaceholder")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="occasion">
                              {t("categories.occasion")}
                            </SelectItem>
                            <SelectItem value="budget">
                              {t("categories.budget")}
                            </SelectItem>
                            <SelectItem value="recipient">
                              {t("categories.recipient")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="searchQuery">
                          {t("dialog.fields.searchQuery")}
                        </Label>
                        <Input
                          id="searchQuery"
                          value={formData.searchQuery}
                          onChange={(e) =>
                            setFormData({ ...formData, searchQuery: e.target.value })
                          }
                          placeholder={t("dialog.fields.searchQueryPlaceholder")}
                        />
                        <p className="text-xs text-muted-foreground">
                          {t("dialog.fields.searchQueryHint")}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="priceMin">{t("dialog.fields.priceMin")}</Label>
                          <Input
                            id="priceMin"
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.priceMin}
                            onChange={(e) =>
                              setFormData({ ...formData, priceMin: e.target.value })
                            }
                            placeholder="0"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="priceMax">{t("dialog.fields.priceMax")}</Label>
                          <Input
                            id="priceMax"
                            type="number"
                            min="0"
                            step="0.01"
                            value={formData.priceMax}
                            onChange={(e) =>
                              setFormData({ ...formData, priceMax: e.target.value })
                            }
                            placeholder="∞"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Display Settings Tab */}
                {activeTab === "settings" && (
                  <div className="space-y-6">
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label>{t("dialog.fields.featuredImage")}</Label>
                        <ImageUpload
                          value={formData.featuredImage || null}
                          onChange={(url) =>
                            setFormData({ ...formData, featuredImage: url || "" })
                          }
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="sortOrder">{t("dialog.fields.sortOrder")}</Label>
                          <Input
                            id="sortOrder"
                            type="number"
                            value={formData.sortOrder}
                            onChange={(e) =>
                              setFormData({ ...formData, sortOrder: e.target.value })
                            }
                          />
                          <p className="text-xs text-muted-foreground">
                            {t("dialog.fields.sortOrderHint")}
                          </p>
                        </div>

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
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t">
                        <div>
                          <Label htmlFor="isPublished">{t("dialog.fields.published")}</Label>
                          <p className="text-xs text-muted-foreground">
                            {t("dialog.fields.publishedHint")}
                          </p>
                        </div>
                        <Switch
                          id="isPublished"
                          checked={formData.isPublished}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, isPublished: checked })
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Preview Mode */
            <div className="flex-1 overflow-y-auto max-h-[calc(90vh-220px)]">
              <div className="space-y-6">
                {/* Preview Card */}
                <div className="rounded-lg border bg-background p-6 shadow-lg">
                  {formData.featuredImage && (
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted mb-6">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={formData.featuredImage}
                        alt={previewLocale === "nl" ? formData.titleNl : formData.titleEn}
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}

                  <div className="text-center sm:text-left">
                    <div className="flex items-center gap-2 mb-2">
                      {formData.category && (
                        <Badge variant="outline" className="gap-1">
                          {getCategoryIcon(formData.category)}
                          {getCategoryLabel(formData.category)}
                        </Badge>
                      )}
                      {(formData.priceMin || formData.priceMax) && (
                        <Badge variant="secondary">
                          {formData.priceMin ? `€${formData.priceMin}` : "€0"}
                          {" - "}
                          {formData.priceMax ? `€${formData.priceMax}` : "∞"}
                        </Badge>
                      )}
                    </div>

                    <h2 className="text-2xl font-bold mb-2">
                      {previewLocale === "nl" ? formData.titleNl : formData.titleEn}
                    </h2>

                    <p className="text-muted-foreground mb-6">
                      {previewLocale === "nl"
                        ? formData.descriptionNl
                        : formData.descriptionEn}
                    </p>
                  </div>

                  {/* Content Preview */}
                  <div
                    className="prose prose-lg dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{
                      __html:
                        previewLocale === "nl"
                          ? formData.contentNl
                          : formData.contentEn,
                    }}
                  />
                </div>

                {/* Preview metadata */}
                <div className="p-4 rounded-lg bg-muted/50 space-y-4 text-sm">
                  <p className="font-medium">{t("dialog.preview.metadata")}</p>
                  <div className="grid grid-cols-2 gap-4 text-muted-foreground">
                    <div>
                      <span className="font-medium">{t("dialog.preview.slug")}:</span>{" "}
                      <code className="font-mono">/{formData.slug}</code>
                    </div>
                    <div>
                      <span className="font-medium">{t("dialog.preview.status")}:</span>{" "}
                      {formData.isPublished ? t("status.published") : t("status.draft")}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <p className="font-medium mb-2">{t("dialog.preview.seoPreview")}</p>
                    <div className="p-3 rounded border bg-background">
                      <p className="text-blue-600 dark:text-blue-400 text-base font-medium truncate">
                        {(previewLocale === "nl" ? formData.metaTitleNl : formData.metaTitleEn) ||
                          (previewLocale === "nl" ? formData.titleNl : formData.titleEn)}
                      </p>
                      <p className="text-green-700 dark:text-green-500 text-xs truncate">
                        wishbubble.com/gift-guides/{formData.slug}
                      </p>
                      <p className="text-muted-foreground text-sm line-clamp-2 mt-1">
                        {(previewLocale === "nl" ? formData.metaDescriptionNl : formData.metaDescriptionEn) ||
                          (previewLocale === "nl" ? formData.descriptionNl : formData.descriptionEn)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-muted-foreground">
                    <div>
                      <span className="font-medium">{t("dialog.preview.keywords")}:</span>{" "}
                      {(previewLocale === "nl" ? formData.keywordsNl : formData.keywordsEn) ||
                        t("dialog.preview.none")}
                    </div>
                    <div>
                      <span className="font-medium">{t("dialog.preview.searchQuery")}:</span>{" "}
                      {formData.searchQuery || t("dialog.preview.none")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-4 pt-4 border-t">
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
                  !formData.descriptionEn ||
                  !formData.descriptionNl
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
              onClick={saveGuide}
              disabled={
                isSaving ||
                !formData.slug ||
                !formData.titleEn ||
                !formData.titleNl ||
                !formData.descriptionEn ||
                !formData.descriptionNl
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

      <ConfirmationDialog {...dialogProps} />
    </div>
  );
}
