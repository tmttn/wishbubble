"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

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
      console.error("Failed to fetch coupons:", error);
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
      console.error("Failed to create coupon:", error);
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
      console.error("Failed to toggle coupon:", error);
    }
  };

  const deleteCoupon = async (coupon: Coupon) => {
    if (!confirm(`Are you sure you want to delete coupon "${coupon.code}"?`)) {
      return;
    }

    try {
      await fetch(`/api/admin/coupons/${coupon.id}`, { method: "DELETE" });
      fetchCoupons();
    } catch (error) {
      console.error("Failed to delete coupon:", error);
    }
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

  if (isLoading) {
    return (
      <div className="container py-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading coupons...</p>
        </div>
      </div>
    );
  }

  const activeCoupons = coupons.filter((c) => c.isActive);
  const totalRedemptions = coupons.reduce(
    (acc, c) => acc + (c._count?.redemptions || c.redemptionCount || 0),
    0
  );

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Coupons</h1>
          <p className="text-muted-foreground">
            Manage discount codes for subscriptions
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Coupon
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Coupon</DialogTitle>
              <DialogDescription>
                Create a new discount code for subscriptions
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="code">Code</Label>
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
                    Generate
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Discount Type</Label>
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
                      <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                      <SelectItem value="FIXED_AMOUNT">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="amount">
                    {formData.discountType === "PERCENTAGE"
                      ? "Percentage"
                      : "Amount (cents)"}
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
                  <Label>Duration</Label>
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
                      <SelectItem value="ONCE">First payment only</SelectItem>
                      <SelectItem value="REPEATING">Multiple months</SelectItem>
                      <SelectItem value="FOREVER">Forever</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.duration === "REPEATING" && (
                  <div className="grid gap-2">
                    <Label htmlFor="months">Months</Label>
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
                  <Label htmlFor="maxRedemptions">Max Redemptions</Label>
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
                    placeholder="Unlimited"
                    min={1}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="validUntil">Valid Until</Label>
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
                <Label htmlFor="syncToStripe">Sync to Stripe</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createCoupon} disabled={isCreating || !formData.code}>
                {isCreating ? "Creating..." : "Create Coupon"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Coupons</CardDescription>
            <CardTitle className="text-2xl">{coupons.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Coupons</CardDescription>
            <CardTitle className="text-2xl">{activeCoupons.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Redemptions</CardDescription>
            <CardTitle className="text-2xl">{totalRedemptions}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Coupons Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Coupons</CardTitle>
        </CardHeader>
        <CardContent>
          {coupons.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No coupons yet</p>
              <p className="text-sm">Create your first discount code</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Stripe</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((coupon) => (
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
                        {coupon.isActive ? "Active" : "Inactive"}
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
        </CardContent>
      </Card>
    </div>
  );
}
