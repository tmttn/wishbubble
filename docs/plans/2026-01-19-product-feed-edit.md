# Product Feed Edit Panel Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a slide-over detail panel to edit existing product feeds, accessible by clicking table rows.

**Architecture:** Create a new `ProductFeedDetailSheet` component using the existing Sheet UI primitive. The panel displays read-only info, action buttons, and an edit form. State management stays in the parent page component.

**Tech Stack:** React, shadcn Sheet component, Zod validation, react-hook-form pattern (manual), Next.js i18n

---

## Task 1: Add Translation Keys

**Files:**
- Modify: `messages/en.json` (add detailSheet section inside productFeeds)
- Modify: `messages/nl.json` (add detailSheet section inside productFeeds)

**Step 1: Add English translations**

In `messages/en.json`, add after the `sortOptions` section (around line 2691), before the closing brace of `productFeeds`:

```json
      "detailSheet": {
        "title": "Provider Details",
        "info": {
          "providerId": "Provider ID",
          "type": "Type",
          "products": "Products",
          "status": "Status",
          "created": "Created",
          "lastSynced": "Last Synced"
        },
        "actions": {
          "title": "Actions",
          "syncFromUrl": "Sync from URL",
          "importCsv": "Import CSV"
        },
        "form": {
          "title": "Settings",
          "displayName": "Display Name",
          "priority": "Priority",
          "priorityHint": "Higher priority = shown first in search results (0-100)",
          "feedUrl": "Feed URL",
          "feedUrlHint": "URL to download the product feed from",
          "urlPatterns": "Website Patterns",
          "urlPatternsHint": "Comma-separated domain patterns (e.g., coolblue.nl, coolblue.be)",
          "affiliateParam": "Affiliate Parameter",
          "affiliateParamHint": "Query parameter name for affiliate code",
          "affiliateCode": "Affiliate Code",
          "affiliateCodeHint": "Your affiliate tracking code",
          "enabled": "Enabled"
        },
        "buttons": {
          "cancel": "Cancel",
          "save": "Save Changes",
          "saving": "Saving...",
          "delete": "Delete Provider"
        },
        "toasts": {
          "updateSuccess": "Provider updated successfully",
          "updateFailed": "Failed to update provider"
        },
        "discardChanges": {
          "title": "Discard changes?",
          "description": "You have unsaved changes. Are you sure you want to close?"
        }
      }
```

**Step 2: Add Dutch translations**

In `messages/nl.json`, add the same structure with Dutch translations:

```json
      "detailSheet": {
        "title": "Provider Details",
        "info": {
          "providerId": "Provider ID",
          "type": "Type",
          "products": "Producten",
          "status": "Status",
          "created": "Aangemaakt",
          "lastSynced": "Laatst gesynchroniseerd"
        },
        "actions": {
          "title": "Acties",
          "syncFromUrl": "Synchroniseren",
          "importCsv": "CSV Importeren"
        },
        "form": {
          "title": "Instellingen",
          "displayName": "Weergavenaam",
          "priority": "Prioriteit",
          "priorityHint": "Hogere prioriteit = eerst getoond in zoekresultaten (0-100)",
          "feedUrl": "Feed URL",
          "feedUrlHint": "URL om de productfeed te downloaden",
          "urlPatterns": "Website Patronen",
          "urlPatternsHint": "Komma-gescheiden domeinpatronen (bijv. coolblue.nl, coolblue.be)",
          "affiliateParam": "Affiliate Parameter",
          "affiliateParamHint": "Query parameter naam voor affiliate code",
          "affiliateCode": "Affiliate Code",
          "affiliateCodeHint": "Jouw affiliate tracking code",
          "enabled": "Ingeschakeld"
        },
        "buttons": {
          "cancel": "Annuleren",
          "save": "Wijzigingen Opslaan",
          "saving": "Opslaan...",
          "delete": "Provider Verwijderen"
        },
        "toasts": {
          "updateSuccess": "Provider succesvol bijgewerkt",
          "updateFailed": "Bijwerken van provider mislukt"
        },
        "discardChanges": {
          "title": "Wijzigingen negeren?",
          "description": "Je hebt niet-opgeslagen wijzigingen. Weet je zeker dat je wilt sluiten?"
        }
      }
```

**Step 3: Regenerate type definitions**

Run: `npm run i18n:generate` (or the equivalent command for this project)

**Step 4: Commit**

```bash
git add messages/en.json messages/nl.json src/i18n/types.generated.ts
git commit -m "feat(product-feeds): add translations for detail sheet"
```

---

## Task 2: Create ProductFeedDetailSheet Component

**Files:**
- Create: `src/components/admin/product-feed-detail-sheet.tsx`

**Step 1: Create the component file**

```tsx
"use client";

import * as Sentry from "@sentry/nextjs";
import { useState, useEffect, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Loader2,
  RefreshCw,
  Upload,
  Trash2,
  Database,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { useTypedTranslations } from "@/i18n/useTypedTranslations";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

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
}

interface ProductFeedDetailSheetProps {
  provider: ProductProvider | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
  onDelete: (provider: ProductProvider) => void;
  onImport: (providerId: string) => void;
  onSync: (provider: ProductProvider) => void;
  isSyncing: string | null;
  syncProgress: {
    progress: number;
    recordsTotal: number;
    recordsImported: number;
    recordsFailed: number;
  } | null;
}

interface FormData {
  name: string;
  priority: number;
  enabled: boolean;
  feedUrl: string;
  affiliateCode: string;
  affiliateParam: string;
  urlPatterns: string;
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

export function ProductFeedDetailSheet({
  provider,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
  onImport,
  onSync,
  isSyncing,
  syncProgress,
}: ProductFeedDetailSheetProps) {
  const t = useTypedTranslations("admin.productFeeds");
  const tConfirmations = useTypedTranslations("confirmations");

  const [formData, setFormData] = useState<FormData>({
    name: "",
    priority: 0,
    enabled: true,
    feedUrl: "",
    affiliateCode: "",
    affiliateParam: "",
    urlPatterns: "",
  });
  const [originalData, setOriginalData] = useState<FormData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  // Initialize form when provider changes
  useEffect(() => {
    if (provider) {
      const data: FormData = {
        name: provider.name,
        priority: provider.priority,
        enabled: provider.enabled,
        feedUrl: provider.feedUrl || "",
        affiliateCode: provider.affiliateCode || "",
        affiliateParam: provider.affiliateParam || "",
        urlPatterns: provider.urlPatterns || "",
      };
      setFormData(data);
      setOriginalData(data);
    }
  }, [provider]);

  const isDirty = useCallback(() => {
    if (!originalData) return false;
    return (
      formData.name !== originalData.name ||
      formData.priority !== originalData.priority ||
      formData.enabled !== originalData.enabled ||
      formData.feedUrl !== originalData.feedUrl ||
      formData.affiliateCode !== originalData.affiliateCode ||
      formData.affiliateParam !== originalData.affiliateParam ||
      formData.urlPatterns !== originalData.urlPatterns
    );
  }, [formData, originalData]);

  const handleClose = useCallback(() => {
    if (isDirty()) {
      setShowDiscardDialog(true);
    } else {
      onOpenChange(false);
    }
  }, [isDirty, onOpenChange]);

  const handleSave = async () => {
    if (!provider) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/product-feeds/${provider.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          priority: formData.priority,
          enabled: formData.enabled,
          feedUrl: formData.feedUrl || null,
          affiliateCode: formData.affiliateCode || null,
          affiliateParam: formData.affiliateParam || null,
          urlPatterns: formData.urlPatterns || null,
        }),
      });

      if (response.ok) {
        toast.success(t("detailSheet.toasts.updateSuccess"));
        setOriginalData(formData);
        onUpdate();
      } else {
        const error = await response.json();
        toast.error(error.error || t("detailSheet.toasts.updateFailed"));
      }
    } catch (error) {
      Sentry.captureException(error, {
        tags: { component: "ProductFeedDetailSheet", action: "save" },
      });
      toast.error(t("detailSheet.toasts.updateFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  const syncStatusTranslations = {
    synced: t("syncStatus.synced"),
    failed: t("syncStatus.failed"),
    syncing: t("syncStatus.syncing"),
    pending: t("syncStatus.pending"),
  };

  if (!provider) return null;

  const isCurrentlySyncing = isSyncing === provider.id;

  return (
    <>
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent className="sm:max-w-lg w-full overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{provider.name}</SheetTitle>
            <SheetDescription>
              <code className="text-xs">{provider.providerId}</code>
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 py-4">
            {/* Read-only Info Section */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">
                  {t("detailSheet.info.type")}
                </p>
                <Badge className={getTypeColor(provider.type)}>
                  {provider.type}
                </Badge>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">
                  {t("detailSheet.info.products")}
                </p>
                <p className="font-semibold flex items-center justify-center gap-1">
                  <Database className="h-3 w-3" />
                  {provider.productCount.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">
                  {t("detailSheet.info.status")}
                </p>
                {getSyncStatusBadge(provider.syncStatus, syncStatusTranslations)}
              </div>
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("detailSheet.info.created")}
                </span>
                <span>{formatDate(provider.createdAt, t("never"))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("detailSheet.info.lastSynced")}
                </span>
                <span>{formatDate(provider.lastSynced, t("never"))}</span>
              </div>
            </div>

            <Separator />

            {/* Actions Section */}
            {provider.type === "FEED" && (
              <>
                <div>
                  <h4 className="text-sm font-medium mb-3">
                    {t("detailSheet.actions.title")}
                  </h4>
                  {isCurrentlySyncing ? (
                    <div className="flex items-center gap-3">
                      <Progress
                        value={syncProgress?.progress ?? 0}
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {syncProgress
                          ? `${syncProgress.progress}%`
                          : t("sync.starting")}
                      </span>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      {provider.feedUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onSync(provider)}
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          {t("detailSheet.actions.syncFromUrl")}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onImport(provider.id)}
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        {t("detailSheet.actions.importCsv")}
                      </Button>
                    </div>
                  )}
                </div>
                <Separator />
              </>
            )}

            {/* Edit Form Section */}
            <div>
              <h4 className="text-sm font-medium mb-3">
                {t("detailSheet.form.title")}
              </h4>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">
                    {t("detailSheet.form.displayName")}
                  </Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-priority">
                    {t("detailSheet.form.priority")}
                  </Label>
                  <Input
                    id="edit-priority"
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
                    {t("detailSheet.form.priorityHint")}
                  </p>
                </div>

                {provider.type === "FEED" && (
                  <div className="grid gap-2">
                    <Label htmlFor="edit-feedUrl">
                      {t("detailSheet.form.feedUrl")}
                    </Label>
                    <Input
                      id="edit-feedUrl"
                      value={formData.feedUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, feedUrl: e.target.value })
                      }
                      placeholder="https://..."
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("detailSheet.form.feedUrlHint")}
                    </p>
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="edit-urlPatterns">
                    {t("detailSheet.form.urlPatterns")}
                  </Label>
                  <Input
                    id="edit-urlPatterns"
                    value={formData.urlPatterns}
                    onChange={(e) =>
                      setFormData({ ...formData, urlPatterns: e.target.value })
                    }
                    placeholder="example.com, example.nl"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("detailSheet.form.urlPatternsHint")}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-affiliateParam">
                      {t("detailSheet.form.affiliateParam")}
                    </Label>
                    <Input
                      id="edit-affiliateParam"
                      value={formData.affiliateParam}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          affiliateParam: e.target.value,
                        })
                      }
                      placeholder="ref"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-affiliateCode">
                      {t("detailSheet.form.affiliateCode")}
                    </Label>
                    <Input
                      id="edit-affiliateCode"
                      value={formData.affiliateCode}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          affiliateCode: e.target.value,
                        })
                      }
                      placeholder="mysite123"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="edit-enabled"
                    checked={formData.enabled}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, enabled: checked })
                    }
                  />
                  <Label htmlFor="edit-enabled">
                    {t("detailSheet.form.enabled")}
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <SheetFooter className="flex-row justify-between border-t pt-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(provider)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              {t("detailSheet.buttons.delete")}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>
                {t("detailSheet.buttons.cancel")}
              </Button>
              <Button onClick={handleSave} disabled={isSaving || !isDirty()}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    {t("detailSheet.buttons.saving")}
                  </>
                ) : (
                  t("detailSheet.buttons.save")
                )}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("detailSheet.discardChanges.title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("detailSheet.discardChanges.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tConfirmations("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowDiscardDialog(false);
                onOpenChange(false);
              }}
            >
              {tConfirmations("discard")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
```

**Step 2: Export from admin components index**

Check if there's an index file at `src/components/admin/index.ts` and add the export. If not, skip this step.

**Step 3: Commit**

```bash
git add src/components/admin/product-feed-detail-sheet.tsx
git commit -m "feat(product-feeds): create ProductFeedDetailSheet component"
```

---

## Task 3: Integrate Sheet into Product Feeds Page

**Files:**
- Modify: `src/app/(admin)/admin/product-feeds/page.tsx`

**Step 1: Add import for the new component**

At the top of the file, add:

```tsx
import { ProductFeedDetailSheet } from "@/components/admin/product-feed-detail-sheet";
```

**Step 2: Add state for selected provider**

Inside `ProductFeedsPage` component, after the existing state declarations (around line 260), add:

```tsx
const [selectedProvider, setSelectedProvider] = useState<ProductProvider | null>(null);
const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
```

**Step 3: Add row click handler**

After the `handlePerPageChange` function (around line 746), add:

```tsx
const handleRowClick = (provider: ProductProvider, event: React.MouseEvent) => {
  // Don't open sheet if clicking on interactive elements
  const target = event.target as HTMLElement;
  if (
    target.closest('button') ||
    target.closest('[role="switch"]') ||
    target.closest('[data-slot="switch"]')
  ) {
    return;
  }
  setSelectedProvider(provider);
  setIsDetailSheetOpen(true);
};

const handleDetailSheetClose = (open: boolean) => {
  setIsDetailSheetOpen(open);
  if (!open) {
    // Small delay to allow animations to complete
    setTimeout(() => setSelectedProvider(null), 300);
  }
};

const handleProviderUpdate = () => {
  fetchProviders();
  // Update the selected provider with fresh data
  if (selectedProvider) {
    const updated = providers.find((p) => p.id === selectedProvider.id);
    if (updated) {
      setSelectedProvider(updated);
    }
  }
};
```

**Step 4: Make table rows clickable**

Find the `<TableRow key={provider.id}>` element (around line 1207) and add onClick and cursor styling:

Change from:
```tsx
<TableRow key={provider.id}>
```

To:
```tsx
<TableRow
  key={provider.id}
  className="cursor-pointer hover:bg-muted/50"
  onClick={(e) => handleRowClick(provider, e)}
>
```

**Step 5: Render the detail sheet**

Before the `<ConfirmationDialog {...dialogProps} />` at the end of the component (around line 1535), add:

```tsx
<ProductFeedDetailSheet
  provider={selectedProvider}
  open={isDetailSheetOpen}
  onOpenChange={handleDetailSheetClose}
  onUpdate={handleProviderUpdate}
  onDelete={deleteProvider}
  onImport={handleImportClick}
  onSync={handleSyncFromUrl}
  isSyncing={isSyncing}
  syncProgress={syncProgress}
/>
```

**Step 6: Commit**

```bash
git add src/app/\\(admin\\)/admin/product-feeds/page.tsx
git commit -m "feat(product-feeds): integrate detail sheet with table row click"
```

---

## Task 4: Test the Implementation

**Step 1: Start the development server**

```bash
npm run dev
```

**Step 2: Manual testing checklist**

1. Navigate to `/admin/product-feeds`
2. Click on a table row - sheet should open from the right
3. Verify read-only info displays correctly (type, products, status, dates)
4. Verify form is pre-populated with current values
5. Change the priority field - Save button should become enabled
6. Click Save - verify toast appears and table updates
7. Make a change, then click Cancel - verify discard confirmation appears
8. Click outside sheet with unsaved changes - verify discard confirmation
9. Test Sync button (for FEED providers with URL)
10. Test Import button opens the import dialog
11. Test Delete button shows confirmation and deletes

**Step 3: Commit any fixes**

If any issues found, fix and commit:

```bash
git add -A
git commit -m "fix(product-feeds): address issues found during testing"
```

---

## Task 5: Final Commit and Cleanup

**Step 1: Verify all changes work together**

```bash
npm run build
```

**Step 2: Create final commit if build passes**

```bash
git add -A
git commit -m "feat(product-feeds): complete edit panel implementation"
```
