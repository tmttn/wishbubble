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
  DialogTrigger,
} from "@/components/ui/dialog";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ConfirmationDialog,
  useConfirmation,
} from "@/components/ui/confirmation-dialog";
import { useTranslations } from "next-intl";

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
    });
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

  const getStatus = (announcement: Announcement) => {
    if (!announcement.isActive) return "inactive";
    const now = new Date();
    if (announcement.publishedAt && new Date(announcement.publishedAt) > now)
      return "scheduled";
    if (announcement.expiresAt && new Date(announcement.expiresAt) < now)
      return "expired";
    return "active";
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

  const activeAnnouncements = announcements.filter(
    (a) => getStatus(a) === "active"
  );
  const totalDismissals = announcements.reduce(
    (acc, a) => acc + (a._count?.dismissals || 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          {t("newAnnouncement")}
        </Button>
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

      {/* Announcements Table */}
      <Card className="border-0 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>{t("table.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {announcements.length === 0 ? (
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
                {announcements.map((announcement) => {
                  const status = getStatus(announcement);
                  return (
                    <TableRow key={announcement.id}>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="font-medium truncate">
                            {announcement.titleEn}
                          </p>
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

          <Tabs defaultValue="en" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="en">{t("dialog.tabs.english")}</TabsTrigger>
              <TabsTrigger value="nl">{t("dialog.tabs.dutch")}</TabsTrigger>
            </TabsList>

            <TabsContent value="en" className="space-y-4 mt-4">
              <div className="grid gap-2">
                <Label htmlFor="titleEn">{t("dialog.fields.titleEn")}</Label>
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
                <Label htmlFor="titleNl">{t("dialog.fields.titleNl")}</Label>
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
              <Label htmlFor="imageUrl">{t("dialog.fields.imageUrl")}</Label>
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
                <Label htmlFor="ctaLabel">{t("dialog.fields.ctaLabel")}</Label>
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
                      onCheckedChange={(checked: boolean | "indeterminate") =>
                        handleTierChange(tier, checked === true)
                      }
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
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {t("dialog.buttons.cancel")}
            </Button>
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

      <ConfirmationDialog {...dialogProps} />
    </div>
  );
}
