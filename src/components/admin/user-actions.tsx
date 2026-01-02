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
import { AlertTriangle, Ban, Trash2, UserCheck } from "lucide-react";
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
}: UserActionsProps) {
  const router = useRouter();
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [unsuspendOpen, setUnsuspendOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Suspend form state
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendDuration, setSuspendDuration] = useState<string>("7");

  // Delete form state
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteReason, setDeleteReason] = useState("");

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

  // Don't show actions for admin users
  if (isAdmin) {
    return (
      <div className="bg-muted/50 rounded-lg p-4 text-center text-muted-foreground">
        Admin users cannot be suspended or deleted
      </div>
    );
  }

  return (
    <>
      {/* Suspension Status Banner */}
      {isSuspended && (
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

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {isSuspended ? (
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
        )}

        <Button
          variant="outline"
          onClick={() => setDeleteOpen(true)}
          className="gap-2 text-destructive border-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
          Delete User
        </Button>
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
    </>
  );
}
