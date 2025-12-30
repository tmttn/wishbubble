"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  MoreVertical,
  Shield,
  ShieldOff,
  UserMinus,
  LogOut,
  Loader2,
} from "lucide-react";

type BubbleRole = "OWNER" | "ADMIN" | "MEMBER";

interface Member {
  id: string;
  userId: string;
  role: BubbleRole;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

interface MemberActionsMenuProps {
  member: Member;
  bubbleId: string;
  bubbleName: string;
  currentUserId: string;
  currentUserRole: BubbleRole;
  ownerId: string;
}

type DialogType = "remove" | "leave" | "promote" | "demote" | null;

export function MemberActionsMenu({
  member,
  bubbleId,
  bubbleName,
  currentUserId,
  currentUserRole,
  ownerId,
}: MemberActionsMenuProps) {
  const router = useRouter();
  const t = useTranslations("bubbles.members");
  const tToasts = useTranslations("toasts");
  const tRoles = useTranslations("bubbles.members.roles");

  const [dialogType, setDialogType] = useState<DialogType>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isOwner = currentUserId === ownerId;
  const isAdmin = currentUserRole === "ADMIN" || currentUserRole === "OWNER";
  const isSelf = member.userId === currentUserId;
  const memberIsOwner = member.userId === ownerId;

  // Determine which actions to show
  const canRemove = !isSelf && !memberIsOwner && (isOwner || (isAdmin && member.role === "MEMBER"));
  const canChangeRole = isOwner && !isSelf && !memberIsOwner;
  const canLeave = isSelf && !memberIsOwner;

  // If no actions available, don't render menu
  if (!canRemove && !canChangeRole && !canLeave) {
    return null;
  }

  const handleRemoveMember = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/bubbles/${bubbleId}/members/${member.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to remove member");
      }

      toast.success(tToasts("success.memberRemoved", { name: member.user.name || "Member" }));
      router.refresh();
    } catch (error) {
      toast.error(tToasts("error.removeMemberFailed"));
    } finally {
      setIsLoading(false);
      setDialogType(null);
    }
  };

  const handleLeaveGroup = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/bubbles/${bubbleId}/members/leave`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        if (data.error?.includes("Owner cannot leave")) {
          toast.error(tToasts("error.ownerCannotLeave"));
        } else {
          throw new Error(data.error || "Failed to leave group");
        }
        return;
      }

      toast.success(tToasts("success.leftGroup"));
      router.push("/bubbles");
    } catch (error) {
      toast.error(tToasts("error.leaveGroupFailed"));
    } finally {
      setIsLoading(false);
      setDialogType(null);
    }
  };

  const handleChangeRole = async (newRole: "ADMIN" | "MEMBER") => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/bubbles/${bubbleId}/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to change role");
      }

      const roleLabel = newRole === "ADMIN" ? tRoles("admin") : tRoles("member");
      toast.success(tToasts("success.roleChanged", {
        name: member.user.name || "Member",
        role: roleLabel
      }));
      router.refresh();
    } catch (error) {
      toast.error(tToasts("error.roleChangeFailed"));
    } finally {
      setIsLoading(false);
      setDialogType(null);
    }
  };

  const getDialogContent = () => {
    switch (dialogType) {
      case "remove":
        return {
          title: t("confirmRemove.title", { name: member.user.name || "Member" }),
          description: t("confirmRemove.description"),
          confirmText: t("confirmRemove.confirm"),
          cancelText: t("confirmRemove.cancel"),
          onConfirm: handleRemoveMember,
          variant: "destructive" as const,
        };
      case "leave":
        return {
          title: t("confirmLeave.title", { bubbleName }),
          description: t("confirmLeave.description"),
          confirmText: t("confirmLeave.confirm"),
          cancelText: t("confirmLeave.cancel"),
          onConfirm: handleLeaveGroup,
          variant: "destructive" as const,
        };
      case "promote":
        return {
          title: t("confirmRoleChange.promoteTitle", { name: member.user.name || "Member" }),
          description: t("confirmRoleChange.promoteDescription"),
          confirmText: t("confirmRoleChange.confirm"),
          cancelText: t("confirmRoleChange.cancel"),
          onConfirm: () => handleChangeRole("ADMIN"),
          variant: "default" as const,
        };
      case "demote":
        return {
          title: t("confirmRoleChange.demoteTitle", { name: member.user.name || "Member" }),
          description: t("confirmRoleChange.demoteDescription"),
          confirmText: t("confirmRoleChange.confirm"),
          cancelText: t("confirmRoleChange.cancel"),
          onConfirm: () => handleChangeRole("MEMBER"),
          variant: "default" as const,
        };
      default:
        return null;
    }
  };

  const dialogContent = getDialogContent();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2"
          >
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">{t("actions.title")}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canChangeRole && (
            <>
              {member.role === "MEMBER" && (
                <DropdownMenuItem onSelect={() => setDialogType("promote")}>
                  <Shield className="mr-2 h-4 w-4" />
                  {t("actions.promoteToAdmin")}
                </DropdownMenuItem>
              )}
              {member.role === "ADMIN" && (
                <DropdownMenuItem onSelect={() => setDialogType("demote")}>
                  <ShieldOff className="mr-2 h-4 w-4" />
                  {t("actions.demoteToMember")}
                </DropdownMenuItem>
              )}
              {canRemove && <DropdownMenuSeparator />}
            </>
          )}
          {canRemove && (
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setDialogType("remove")}
            >
              <UserMinus className="mr-2 h-4 w-4" />
              {t("actions.removeMember")}
            </DropdownMenuItem>
          )}
          {canLeave && (
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setDialogType("leave")}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t("actions.leaveGroup")}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Confirmation Dialog */}
      <Dialog open={dialogType !== null} onOpenChange={() => setDialogType(null)}>
        {dialogContent && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{dialogContent.title}</DialogTitle>
              <DialogDescription>{dialogContent.description}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDialogType(null)}
                disabled={isLoading}
              >
                {dialogContent.cancelText}
              </Button>
              <Button
                variant={dialogContent.variant}
                onClick={dialogContent.onConfirm}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {dialogContent.confirmText}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
