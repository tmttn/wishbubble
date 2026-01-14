"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTypedTranslations } from "@/i18n/useTypedTranslations";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Crown, Loader2, Search, UserCog } from "lucide-react";

interface Member {
  id: string;
  userId: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  user: {
    id: string;
    name: string | null;
    email: string | null;
    avatarUrl?: string | null;
    image?: string | null;
  };
}

interface TransferOwnershipDialogProps {
  bubbleId: string;
  members: Member[];
}

export function TransferOwnershipDialog({
  bubbleId,
  members,
}: TransferOwnershipDialogProps) {
  const router = useRouter();
  const t = useTypedTranslations("bubbles.members.transferOwnership");
  const tToasts = useTypedTranslations("toasts");
  const tRoles = useTypedTranslations("bubbles.members.roles");

  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmStep, setConfirmStep] = useState(false);

  const filteredMembers = members.filter((member) => {
    const query = searchQuery.toLowerCase();
    return (
      member.user.name?.toLowerCase().includes(query) ||
      member.user.email?.toLowerCase().includes(query)
    );
  });

  // Sort: admins first, then alphabetically
  const sortedMembers = [...filteredMembers].sort((a, b) => {
    if (a.role === "ADMIN" && b.role !== "ADMIN") return -1;
    if (a.role !== "ADMIN" && b.role === "ADMIN") return 1;
    return (a.user.name || "").localeCompare(b.user.name || "");
  });

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleTransfer = async () => {
    if (!selectedMember) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/bubbles/${bubbleId}/transfer-ownership`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newOwnerId: selectedMember.userId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to transfer ownership");
      }

      toast.success(
        tToasts("success.ownershipTransferred", {
          name: selectedMember.user.name || "Member",
        })
      );
      setOpen(false);
      router.refresh();
    } catch {
      toast.error(tToasts("error.transferOwnershipFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedMember(null);
    setConfirmStep(false);
    setSearchQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) handleClose();
      else setOpen(true);
    }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <UserCog className="mr-2 h-4 w-4" />
          {t("title")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {!confirmStep ? (
          <>
            <DialogHeader>
              <DialogTitle>{t("title")}</DialogTitle>
              <DialogDescription>{t("description")}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t("searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <ScrollArea className="h-[250px] rounded-md border">
                <div className="p-2 space-y-1">
                  {sortedMembers.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No members found
                    </p>
                  ) : (
                    sortedMembers.map((member) => (
                      <button
                        key={member.id}
                        onClick={() => {
                          setSelectedMember(member);
                          setConfirmStep(true);
                        }}
                        className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors text-left"
                      >
                        <Avatar className="h-9 w-9">
                          <AvatarImage
                            src={member.user.image || member.user.avatarUrl || undefined}
                          />
                          <AvatarFallback>
                            {getInitials(member.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {member.user.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {member.user.email}
                          </p>
                        </div>
                        {member.role === "ADMIN" && (
                          <Badge variant="outline" className="text-xs shrink-0">
                            {tRoles("admin")}
                          </Badge>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                {t("cancel")}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500" />
                {t("confirmTitle", { name: selectedMember?.user.name || "Member" })}
              </DialogTitle>
              <DialogDescription>
                {t("confirmDescription", { name: selectedMember?.user.name || "this member" })}
              </DialogDescription>
            </DialogHeader>

            {selectedMember && (
              <div className="py-4">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={selectedMember.user.image || selectedMember.user.avatarUrl || undefined}
                    />
                    <AvatarFallback>
                      {getInitials(selectedMember.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{selectedMember.user.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedMember.user.email}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setConfirmStep(false)}
                disabled={isLoading}
              >
                {t("cancel")}
              </Button>
              <Button onClick={handleTransfer} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("confirm")}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
