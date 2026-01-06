"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Gift,
  Sparkles,
  Globe,
  TreePine,
  Heart,
  Cake,
  PartyPopper,
  Archive,
} from "lucide-react";
import { BubbleDetailPanel } from "./bubble-detail-panel";
import { UserDetailPanel } from "./user-detail-panel";

interface Group {
  id: string;
  name: string;
  slug: string;
  occasionType: string;
  eventDate: Date | null;
  isSecretSanta: boolean;
  secretSantaDrawn: boolean;
  isPublic: boolean;
  createdAt: Date;
  archivedAt: Date | null;
  owner: {
    id: string;
    name: string | null;
    email: string;
  };
  _count: {
    members: number;
    wishlists: number;
    claims: number;
  };
}

interface GroupsListClientProps {
  groups: Group[];
  labels: {
    owner: string;
    members: string;
    wishlists: string;
    claims: string;
    secretSanta: string;
    drawn: string;
    public: string;
    archived: string;
    created: string;
  };
}

const occasionIcons: Record<string, typeof Gift> = {
  CHRISTMAS: TreePine,
  BIRTHDAY: Cake,
  WEDDING: Heart,
  OTHER: PartyPopper,
};

const occasionColors: Record<string, string> = {
  CHRISTMAS: "from-red-500/10 to-green-500/10",
  BIRTHDAY: "from-pink-500/10 to-purple-500/10",
  WEDDING: "from-rose-500/10 to-amber-500/10",
  OTHER: "from-blue-500/10 to-cyan-500/10",
};

export function GroupsListClient({ groups, labels }: GroupsListClientProps) {
  const [selectedBubbleId, setSelectedBubbleId] = useState<string | null>(null);
  const [bubblePanelOpen, setBubblePanelOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userPanelOpen, setUserPanelOpen] = useState(false);

  const handleGroupClick = (groupId: string, e: React.MouseEvent) => {
    // Allow Ctrl/Cmd+click to open in new tab
    if (e.ctrlKey || e.metaKey) {
      return;
    }
    e.preventDefault();
    setSelectedBubbleId(groupId);
    setBubblePanelOpen(true);
  };

  const handleOwnerClick = (ownerId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedUserId(ownerId);
    setUserPanelOpen(true);
  };

  const handleNavigateToUser = (userId: string) => {
    setBubblePanelOpen(false);
    setSelectedUserId(userId);
    setUserPanelOpen(true);
  };

  const handleNavigateToBubble = (bubbleId: string) => {
    setUserPanelOpen(false);
    setSelectedBubbleId(bubbleId);
    setBubblePanelOpen(true);
  };

  const handleNavigateToWishlist = (wishlistId: string) => {
    setBubblePanelOpen(false);
    setUserPanelOpen(false);
    window.location.href = `/admin/wishlists/${wishlistId}`;
  };

  return (
    <>
      <div className="grid gap-3">
        {groups.map((group, index) => {
          const OccasionIcon = occasionIcons[group.occasionType] || Gift;
          const gradientClass = group.archivedAt
            ? "from-gray-500/10 to-gray-500/5 opacity-75"
            : (occasionColors[group.occasionType] || "from-gray-500/10 to-gray-500/5");
          const isUpcoming = group.eventDate && group.eventDate > new Date();
          const isPast = group.eventDate && group.eventDate < new Date();
          const isArchived = !!group.archivedAt;

          return (
            <Link
              key={group.id}
              href={`/admin/groups/${group.id}`}
              onClick={(e) => handleGroupClick(group.id, e)}
            >
              <Card
                className={`border-0 bg-gradient-to-r ${gradientClass} backdrop-blur-sm hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group cursor-pointer`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl bg-background/50 group-hover:scale-105 transition-transform ${isArchived ? "opacity-50" : ""}`}>
                      <OccasionIcon className={`h-6 w-6 ${isArchived ? "text-muted-foreground" : "text-primary"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-medium truncate group-hover:text-primary transition-colors ${isArchived ? "text-muted-foreground" : ""}`}>
                          {group.name}
                        </span>
                        {isArchived && (
                          <Badge variant="secondary" className="text-xs bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/30">
                            <Archive className="h-3 w-3 mr-1" />
                            {labels.archived}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {group.occasionType}
                        </Badge>
                        {group.isSecretSanta && (
                          <Badge
                            className={
                              group.secretSantaDrawn
                                ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30"
                                : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
                            }
                          >
                            <Sparkles className="h-3 w-3 mr-1" />
                            {group.secretSantaDrawn ? labels.drawn : labels.secretSanta}
                          </Badge>
                        )}
                        {group.isPublic && (
                          <Badge variant="secondary" className="text-xs">
                            <Globe className="h-3 w-3 mr-1" />
                            {labels.public}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {labels.owner}:{" "}
                        <button
                          onClick={(e) => handleOwnerClick(group.owner.id, e)}
                          className="hover:underline hover:text-foreground transition-colors"
                        >
                          {group.owner.name || group.owner.email}
                        </button>
                      </p>
                    </div>
                    <div className="hidden md:flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="font-semibold text-foreground">{group._count.members}</p>
                        <p className="text-xs text-muted-foreground">{labels.members}</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-foreground">{group._count.wishlists}</p>
                        <p className="text-xs text-muted-foreground">{labels.wishlists}</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-foreground">{group._count.claims}</p>
                        <p className="text-xs text-muted-foreground">{labels.claims}</p>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      {group.eventDate && (
                        <div className={`flex items-center gap-1 mb-1 ${isUpcoming ? "text-green-600 dark:text-green-400" : isPast ? "text-muted-foreground" : ""}`}>
                          <Calendar className="h-4 w-4" />
                          <span className="font-medium">{group.eventDate.toLocaleDateString()}</span>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {labels.created.replace("{date}", group.createdAt.toLocaleDateString())}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <BubbleDetailPanel
        bubbleId={selectedBubbleId}
        open={bubblePanelOpen}
        onOpenChange={setBubblePanelOpen}
        onNavigateToUser={handleNavigateToUser}
        onNavigateToWishlist={handleNavigateToWishlist}
      />

      <UserDetailPanel
        userId={selectedUserId}
        open={userPanelOpen}
        onOpenChange={setUserPanelOpen}
        onNavigateToBubble={handleNavigateToBubble}
        onNavigateToWishlist={handleNavigateToWishlist}
      />
    </>
  );
}
