"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Ticket,
  Percent,
  Euro,
  Copy,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ConfirmationDialog,
  useConfirmation,
} from "@/components/ui/confirmation-dialog";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { AdminClientPagination, AdminClientSearch, AdminClientSortHeader } from "@/components/admin";

interface Coupon {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountAmount: number;
  appliesToTiers: string[];
  appliesToInterval: string[];
  duration: "ONCE" | "REPEATING" | "FOREVER";
  durationMonths: number | null;
  maxRedemptions: number | null;
  redemptionCount: number;
  validFrom: string;
  validUntil: string | null;
  isActive: boolean;
  stripeCouponId: string | null;
  createdAt: string;
  _count?: { redemptions: number };
}

function formatDiscount(coupon: Coupon): string {
  if (coupon.discountType === "PERCENTAGE") {
    return `${coupon.discountAmount}%`;
  }
  return `€${(coupon.discountAmount / 100).toFixed(2)}`;
}

function formatDuration(coupon: Coupon): string {
  switch (coupon.duration) {
    case "ONCE":
      return "First payment only";
    case "REPEATING":
      return `${coupon.durationMonths} months`;
    case "FOREVER":
      return "Forever";
    default:
      return coupon.duration;
  }
}

export default function CouponsPage() {
  const t = useTranslations("admin.couponsPage");
  const tConfirmations = useTranslations("confirmations");
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const { confirm, dialogProps } = useConfirmation();

  // Filtering, sorting, and pagination state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Form state
  const [formData, setFormData] = useState({
    code: "",
    discountType: "PERCENTAGE" as "PERCENTAGE" | "FIXED_AMOUNT",
    discountAmount: 10,
    duration: "ONCE" as "ONCE" | "REPEATING" | "FOREVER",
    durationMonths: 3,
    maxRedemptions: "",
    validUntil: "",
    syncToStripe: true,
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const response = await fetch("/api/admin/coupons");
      const data = await response.json();
      setCoupons(data);
    } catch (error) {
      Sentry.captureException(error, { tags: { component: "CouponsPage", action: "fetchCoupons" } });
    } finally {
      setIsLoading(false);
    }
  };

  const createCoupon = async () => {
    setIsCreating(true);
    try {
      const response = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          maxRedemptions: formData.maxRedemptions
            ? parseInt(formData.maxRedemptions)
            : undefined,
          validUntil: formData.validUntil || undefined,
        }),
      });

      if (response.ok) {
        setIsDialogOpen(false);
        setFormData({
          code: "",
          discountType: "PERCENTAGE",
          discountAmount: 10,
          duration: "ONCE",
          durationMonths: 3,
          maxRedemptions: "",
          validUntil: "",
          syncToStripe: true,
        });
        fetchCoupons();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create coupon");
      }
    } catch (error) {
      Sentry.captureException(error, { tags: { component: "CouponsPage", action: "createCoupon" } });
    } finally {
      setIsCreating(false);
    }
  };

  const toggleCoupon = async (coupon: Coupon) => {
    try {
      await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !coupon.isActive }),
      });
      fetchCoupons();
    } catch (error) {
      Sentry.captureException(error, { tags: { component: "CouponsPage", action: "toggleCoupon" } });
    }
  };

  const deleteCoupon = (coupon: Coupon) => {
    const doDelete = async () => {
      try {
        await fetch(`/api/admin/coupons/${coupon.id}`, { method: "DELETE" });
        fetchCoupons();
      } catch (error) {
        Sentry.captureException(error, { tags: { component: "CouponsPage", action: "deleteCoupon" } });
      }
    };

    confirm({
      title: tConfirmations("deleteCouponTitle"),
      description: `${tConfirmations("deleteCoupon")} (${coupon.code})`,
      confirmText: tConfirmations("delete"),
      cancelText: tConfirmations("cancel"),
      variant: "destructive",
      onConfirm: doDelete,
    });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code });
  };

  const activeCoupons = coupons.filter((c) => c.isActive);
  const totalRedemptions = coupons.reduce(
    (acc, c) => acc + (c._count?.redemptions || c.redemptionCount || 0),
    0
  );

  // Filter and sort coupons
  const filteredAndSortedCoupons = useMemo(() => {
    let filtered = coupons;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((c) => c.code.toLowerCase().includes(query));
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((c) =>
        statusFilter === "active" ? c.isActive : !c.isActive
      );
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0;
      if (sortKey === "code") {
        comparison = a.code.localeCompare(b.code);
      } else if (sortKey === "discount") {
        comparison = a.discountAmount - b.discountAmount;
      } else if (sortKey === "redemptions") {
        comparison =
          (a._count?.redemptions || a.redemptionCount || 0) -
          (b._count?.redemptions || b.redemptionCount || 0);
      } else if (sortKey === "status") {
        comparison = (a.isActive ? 1 : 0) - (b.isActive ? 1 : 0);
      } else {
        // Default: createdAt
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [coupons, searchQuery, statusFilter, sortKey, sortOrder]);

  // Paginate
  const totalPages = Math.ceil(filteredAndSortedCoupons.length / perPage);
  const paginatedCoupons = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredAndSortedCoupons.slice(start, start + perPage);
  }, [filteredAndSortedCoupons, currentPage, perPage]);

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

  const handleStatusFilter = (status: "all" | "active" | "inactive") => {
    setStatusFilter(status);
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
          <h1 className="text-3xl font-bold font-display bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">{t("title")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("subtitle")}
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t("createCoupon")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{t("createCoupon")}</DialogTitle>
              <DialogDescription>
                {t("createDescription")}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="code">{t("code")}</Label>
                <div className="flex gap-2">
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="SAVE20"
                    className="uppercase"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateCode}
                  >
                    {t("generate")}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>{t("discountType")}</Label>
                  <Select
                    value={formData.discountType}
                    onValueChange={(v) =>
                      setFormData({
                        ...formData,
                        discountType: v as "PERCENTAGE" | "FIXED_AMOUNT",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">{t("percentage")}</SelectItem>
                      <SelectItem value="FIXED_AMOUNT">{t("fixedAmount")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="amount">
                    {formData.discountType === "PERCENTAGE"
                      ? t("percentage")
                      : t("amountCents")}
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.discountAmount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discountAmount: parseInt(e.target.value) || 0,
                      })
                    }
                    min={1}
                    max={formData.discountType === "PERCENTAGE" ? 100 : undefined}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>{t("duration")}</Label>
                  <Select
                    value={formData.duration}
                    onValueChange={(v) =>
                      setFormData({
                        ...formData,
                        duration: v as "ONCE" | "REPEATING" | "FOREVER",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ONCE">{t("firstPaymentOnly")}</SelectItem>
                      <SelectItem value="REPEATING">{t("multipleMonths")}</SelectItem>
                      <SelectItem value="FOREVER">{t("forever")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.duration === "REPEATING" && (
                  <div className="grid gap-2">
                    <Label htmlFor="months">{t("months")}</Label>
                    <Input
                      id="months"
                      type="number"
                      value={formData.durationMonths}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          durationMonths: parseInt(e.target.value) || 1,
                        })
                      }
                      min={1}
                      max={24}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="maxRedemptions">{t("maxRedemptions")}</Label>
                  <Input
                    id="maxRedemptions"
                    type="number"
                    value={formData.maxRedemptions}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxRedemptions: e.target.value,
                      })
                    }
                    placeholder={t("unlimited")}
                    min={1}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="validUntil">{t("validUntil")}</Label>
                  <Input
                    id="validUntil"
                    type="datetime-local"
                    value={formData.validUntil}
                    onChange={(e) =>
                      setFormData({ ...formData, validUntil: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="syncToStripe"
                  checked={formData.syncToStripe}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, syncToStripe: checked })
                  }
                />
                <Label htmlFor="syncToStripe">{t("syncToStripe")}</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                {t("cancel")}
              </Button>
              <Button onClick={createCoupon} disabled={isCreating || !formData.code}>
                {isCreating ? t("creating") : t("createCoupon")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-0 bg-gradient-to-br from-orange-500/10 to-orange-500/5 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/20 rounded-xl">
                <Ticket className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("totalCoupons")}</p>
                <p className="text-3xl font-bold">{coupons.length}</p>
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
                <p className="text-sm text-muted-foreground">{t("activeCoupons")}</p>
                <p className="text-3xl font-bold">{activeCoupons.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 bg-gradient-to-br from-blue-500/10 to-blue-500/5 backdrop-blur-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-xl">
                <Percent className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("totalRedemptions")}</p>
                <p className="text-3xl font-bold">{totalRedemptions}</p>
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
              variant={statusFilter === "all" ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-sm"
              onClick={() => handleStatusFilter("all")}
            >
              {t("filters.all")} ({coupons.length})
            </Badge>
            <Badge
              variant={statusFilter === "active" ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-sm bg-green-500/10 hover:bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30"
              onClick={() => handleStatusFilter("active")}
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              {t("active")} ({activeCoupons.length})
            </Badge>
            <Badge
              variant={statusFilter === "inactive" ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-sm"
              onClick={() => handleStatusFilter("inactive")}
            >
              <XCircle className="h-3 w-3 mr-1" />
              {t("inactive")} ({coupons.length - activeCoupons.length})
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
            label={t("sortOptions.code")}
            sortKey="code"
            currentSort={sortKey}
            currentOrder={sortOrder}
            onSort={handleSort}
          />
          <AdminClientSortHeader
            label={t("sortOptions.discount")}
            sortKey="discount"
            currentSort={sortKey}
            currentOrder={sortOrder}
            onSort={handleSort}
          />
          <AdminClientSortHeader
            label={t("sortOptions.redemptions")}
            sortKey="redemptions"
            currentSort={sortKey}
            currentOrder={sortOrder}
            onSort={handleSort}
          />
        </div>
      </div>

      {/* Coupons Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("allCoupons")}</CardTitle>
        </CardHeader>
        <CardContent>
          {paginatedCoupons.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t("noCouponsYet")}</p>
              <p className="text-sm">{t("createFirstCode")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("code")}</TableHead>
                  <TableHead>{t("discount")}</TableHead>
                  <TableHead>{t("duration")}</TableHead>
                  <TableHead>{t("usage")}</TableHead>
                  <TableHead>{t("status")}</TableHead>
                  <TableHead>Stripe</TableHead>
                  <TableHead className="text-right">{t("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCoupons.map((coupon) => (
                  <TableRow key={coupon.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="font-mono font-semibold">
                          {coupon.code}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyCode(coupon.code)}
                        >
                          {copiedCode === coupon.code ? (
                            <CheckCircle className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {coupon.discountType === "PERCENTAGE" ? (
                          <Percent className="h-3 w-3" />
                        ) : (
                          <Euro className="h-3 w-3" />
                        )}
                        {formatDiscount(coupon)}
                      </div>
                    </TableCell>
                    <TableCell>{formatDuration(coupon)}</TableCell>
                    <TableCell>
                      {coupon._count?.redemptions || coupon.redemptionCount || 0}
                      {coupon.maxRedemptions && ` / ${coupon.maxRedemptions}`}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={coupon.isActive ? "default" : "secondary"}
                        className={cn(
                          coupon.isActive &&
                            "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                        )}
                      >
                        {coupon.isActive ? t("active") : t("inactive")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {coupon.stripeCouponId ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Switch
                          checked={coupon.isActive}
                          onCheckedChange={() => toggleCoupon(coupon)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                          onClick={() => deleteCoupon(coupon)}
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
          {filteredAndSortedCoupons.length > 0 && (
            <div className="mt-4">
              <AdminClientPagination
                page={currentPage}
                totalPages={totalPages}
                total={filteredAndSortedCoupons.length}
                perPage={perPage}
                onPageChange={setCurrentPage}
                onPerPageChange={handlePerPageChange}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmationDialog {...dialogProps} />
    </div>
  );
}
