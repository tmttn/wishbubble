"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Ban, Crown, Trash2, UserCheck } from "lucide-react";
import { toast } from "sonner";

interface UserActionsProps {
  userId: string;
  userEmail: string;
  userName: string | null;
  isAdmin: boolean;
  isSuspended: boolean;
  suspendedUntil: Date | null;
  suspensionReason: string | null;
  ownedBubblesCount: number;
  subscriptionTier: string;
}

export function UserActions({
  userId,
  userEmail,
  userName,
  isAdmin,
  isSuspended,
  suspendedUntil,
  suspensionReason,
  ownedBubblesCount,
  subscriptionTier,
}: UserActionsProps) {
  const router = useRouter();
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [unsuspendOpen, setUnsuspendOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [tierOpen, setTierOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Suspend form state
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendDuration, setSuspendDuration] = useState<string>("7");

  // Delete form state
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteReason, setDeleteReason] = useState("");

  // Tier change form state
  const [newTier, setNewTier] = useState<string>(subscriptionTier);
  const [tierReason, setTierReason] = useState("");

  const handleSuspend = async () => {
    if (!suspendReason.trim()) {
      toast.error("Please provide a reason for suspension");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: suspendReason,
          durationDays: suspendDuration === "permanent" ? null : parseInt(suspendDuration),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to suspend user");
      }

      toast.success(data.message);
      setSuspendOpen(false);
      setSuspendReason("");
      setSuspendDuration("7");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to suspend user");
    } finally {
      setLoading(false);
    }
  };

  const handleUnsuspend = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to unsuspend user");
      }

      toast.success(data.message);
      setUnsuspendOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to unsuspend user");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirmation !== userEmail) {
      toast.error("Please type the user's email to confirm deletion");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmation: deleteConfirmation,
          reason: deleteReason || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.bubbles) {
          toast.error(`${data.error}: ${data.bubbles.map((b: { name: string }) => b.name).join(", ")}`);
        } else {
          throw new Error(data.error || "Failed to delete user");
        }
        return;
      }

      toast.success(data.message);
      setDeleteOpen(false);
      router.push("/admin/users");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete user");
    } finally {
      setLoading(false);
    }
  };

  const handleTierChange = async () => {
    if (!tierReason.trim()) {
      toast.error("Please provide a reason for the tier change");
      return;
    }

    if (newTier === subscriptionTier) {
      toast.error("Please select a different tier");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/tier`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier: newTier,
          reason: tierReason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to change tier");
      }

      toast.success(data.message);
      setTierOpen(false);
      setTierReason("");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to change tier");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Suspension Status Banner - only for non-admin users */}
      {!isAdmin && isSuspended && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-600 dark:text-amber-400">
                Account Suspended
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {suspendedUntil
                  ? `Until ${suspendedUntil.toLocaleDateString()}`
                  : "Permanent suspension"}
              </p>
              {suspensionReason && (
                <p className="text-sm text-muted-foreground mt-1">
                  Reason: {suspensionReason}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Admin user notice */}
      {isAdmin && (
        <div className="bg-muted/50 rounded-lg p-3 mb-4 text-sm text-muted-foreground">
          Admin users cannot be suspended or deleted, but their tier can be changed.
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          onClick={() => {
            setNewTier(subscriptionTier);
            setTierOpen(true);
          }}
          className="gap-2 text-purple-600 border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950"
        >
          <Crown className="h-4 w-4" />
          Change Tier
        </Button>

        {!isAdmin && (
          isSuspended ? (
            <Button
              variant="outline"
              onClick={() => setUnsuspendOpen(true)}
              className="gap-2"
            >
              <UserCheck className="h-4 w-4" />
              Unsuspend User
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => setSuspendOpen(true)}
              className="gap-2 text-amber-600 border-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950"
            >
              <Ban className="h-4 w-4" />
              Suspend User
            </Button>
          )
        )}

        {!isAdmin && (
          <Button
            variant="outline"
            onClick={() => setDeleteOpen(true)}
            className="gap-2 text-destructive border-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
            Delete User
          </Button>
        )}
      </div>

      {/* Suspend Dialog */}
      <Dialog open={suspendOpen} onOpenChange={setSuspendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend User</DialogTitle>
            <DialogDescription>
              Suspend {userName || userEmail} from accessing WishBubble. They will
              receive an email notification.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for suspension</Label>
              <Textarea
                id="reason"
                placeholder="Explain why this user is being suspended..."
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Select value={suspendDuration} onValueChange={setSuspendDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 day</SelectItem>
                  <SelectItem value="3">3 days</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                  <SelectItem value="permanent">Permanent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSuspend}
              disabled={loading || !suspendReason.trim()}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {loading ? "Suspending..." : "Suspend User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unsuspend Dialog */}
      <Dialog open={unsuspendOpen} onOpenChange={setUnsuspendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsuspend User</DialogTitle>
            <DialogDescription>
              Remove the suspension from {userName || userEmail}. They will be able
              to log in and use WishBubble again.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUnsuspendOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUnsuspend} disabled={loading}>
              {loading ? "Unsuspending..." : "Unsuspend User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete User</DialogTitle>
            <DialogDescription>
              Permanently delete {userName || userEmail} and all their data. This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {ownedBubblesCount > 0 && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <p className="text-sm text-destructive">
                This user owns {ownedBubblesCount} active group(s). You must
                transfer ownership or delete these groups before deleting the user.
              </p>
            </div>
          )}

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="delete-reason">Reason (optional)</Label>
              <Textarea
                id="delete-reason"
                placeholder="Explain why this user is being deleted..."
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmation">
                Type <span className="font-mono font-bold">{userEmail}</span> to
                confirm
              </Label>
              <Input
                id="confirmation"
                placeholder="user@example.com"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading || deleteConfirmation !== userEmail}
            >
              {loading ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tier Change Dialog */}
      <Dialog open={tierOpen} onOpenChange={setTierOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Subscription Tier</DialogTitle>
            <DialogDescription>
              Change {userName || userEmail}&apos;s subscription tier. This will
              bypass Stripe and grant access directly.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current tier</Label>
              <div className="text-sm text-muted-foreground px-3 py-2 bg-muted rounded-md">
                {subscriptionTier}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-tier">New tier</Label>
              <Select value={newTier} onValueChange={setNewTier}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BASIC">BASIC - Free tier</SelectItem>
                  <SelectItem value="PLUS">PLUS - Standard features</SelectItem>
                  <SelectItem value="COMPLETE">COMPLETE - All features</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tier-reason">Reason for change</Label>
              <Textarea
                id="tier-reason"
                placeholder="e.g., Promotional upgrade, Customer service resolution, Testing..."
                value={tierReason}
                onChange={(e) => setTierReason(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                This will be logged for audit purposes.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTierOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleTierChange}
              disabled={loading || !tierReason.trim() || newTier === subscriptionTier}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {loading ? "Changing..." : "Change Tier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
