"use client";

import { useState, useCallback } from "react";
import { useTypedTranslations } from "@/i18n/useTypedTranslations";
import { useDebouncedCallback } from "use-debounce";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Zap,
  ChevronDown,
  Search,
  Loader2,
  CreditCard,
  AlertCircle,
  Gift,
  Mail,
  Bell,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

type EventType =
  | "payment_succeeded"
  | "payment_failed"
  | "item_claimed"
  | "email_send"
  | "notification_trigger"
  | "trial_expiring";

interface EventConfig {
  type: EventType;
  label: string;
  description: string;
  icon: React.ReactNode;
  requiresUser: boolean;
}

interface User {
  id: string;
  name: string | null;
  email: string;
  image?: string | null;
}

const EVENT_CONFIGS: EventConfig[] = [
  {
    type: "payment_succeeded",
    label: "Payment Succeeded",
    description: "Simulate a successful Stripe payment",
    icon: <CreditCard className="h-4 w-4 text-accent" />,
    requiresUser: true,
  },
  {
    type: "payment_failed",
    label: "Payment Failed",
    description: "Simulate a failed Stripe payment",
    icon: <AlertCircle className="h-4 w-4 text-red-500" />,
    requiresUser: true,
  },
  {
    type: "item_claimed",
    label: "Item Claimed",
    description: "Simulate an item being claimed",
    icon: <Gift className="h-4 w-4 text-blue-500" />,
    requiresUser: true,
  },
  {
    type: "email_send",
    label: "Email Trigger",
    description: "Trigger email send queue processing",
    icon: <Mail className="h-4 w-4 text-amber-500" />,
    requiresUser: false,
  },
  {
    type: "notification_trigger",
    label: "Notification Trigger",
    description: "Trigger notification processing",
    icon: <Bell className="h-4 w-4 text-purple-500" />,
    requiresUser: false,
  },
  {
    type: "trial_expiring",
    label: "Trial Expiring",
    description: "Simulate trial expiration warning",
    icon: <Clock className="h-4 w-4 text-orange-500" />,
    requiresUser: true,
  },
];

export function SimulateEventsDropdown() {
  const t = useTypedTranslations("admin.nav");
  const [open, setOpen] = useState(false);
  const [_selectedEvent, setSelectedEvent] = useState<EventConfig | null>(null);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  // Debounced search for users
  const searchUsers = useDebouncedCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    try {
      const res = await fetch(
        `/api/admin/search?q=${encodeURIComponent(searchQuery)}&limit=5&types=user`
      );
      if (res.ok) {
        const data = await res.json();
        const users: User[] = (data.results || [])
          .filter((r: { type: string }) => r.type === "user")
          .map((r: { id: string; title: string; subtitle?: string }) => ({
            id: r.id,
            name: r.title,
            email: r.subtitle || "",
          }));
        setSearchResults(users);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  }, 300);

  const handleQueryChange = useCallback(
    (value: string) => {
      setQuery(value);
      if (value.length >= 2) {
        setIsSearching(true);
        searchUsers(value);
      } else {
        setSearchResults([]);
        setIsSearching(false);
      }
    },
    [searchUsers]
  );

  const handleSimulate = async (event: EventConfig, user?: User) => {
    setIsSimulating(true);

    try {
      const res = await fetch("/api/admin/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: event.type,
          userId: user?.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || `Failed to simulate ${event.label}`);
        return;
      }

      toast.success(
        user
          ? `${event.label} simulated for ${user.name || user.email}`
          : `${event.label} simulated successfully`
      );
      setOpen(false);
      setSelectedEvent(null);
      setQuery("");
      setSearchResults([]);
    } catch (error) {
      console.error("Simulation error:", error);
      toast.error("Failed to simulate event");
    } finally {
      setIsSimulating(false);
    }
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email.charAt(0).toUpperCase();
  };

  const renderUserSearch = (event: EventConfig) => (
    <DropdownMenuSubContent className="w-72">
      <div className="p-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            className="pl-8 h-9"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>

      <DropdownMenuSeparator />

      {isSearching && (
        <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Searching...
        </div>
      )}

      {!isSearching && searchResults.length > 0 && (
        <>
          {searchResults.map((user) => (
            <DropdownMenuItem
              key={user.id}
              onClick={() => handleSimulate(event, user)}
              disabled={isSimulating}
              className="flex items-center gap-3 py-2"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.image || undefined} />
                <AvatarFallback className="text-xs bg-muted">
                  {getInitials(user.name, user.email)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user.name || "No name"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
              {isSimulating && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
            </DropdownMenuItem>
          ))}
        </>
      )}

      {!isSearching && query.length >= 2 && searchResults.length === 0 && (
        <div className="py-4 text-center text-sm text-muted-foreground">
          No users found
        </div>
      )}

      {!isSearching && query.length < 2 && (
        <div className="py-4 text-center text-sm text-muted-foreground">
          Type to search for a user
        </div>
      )}
    </DropdownMenuSubContent>
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 w-full md:w-auto justify-start md:justify-center">
          <Zap className="h-4 w-4" />
          <span>{t("simulate")}</span>
          <ChevronDown className="h-3 w-3 opacity-50 ml-auto md:ml-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 max-w-[calc(100vw-2rem)]">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Simulate Events
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {EVENT_CONFIGS.map((event) =>
          event.requiresUser ? (
            <DropdownMenuSub key={event.type}>
              <DropdownMenuSubTrigger className="flex items-center gap-3 py-2">
                {event.icon}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{event.label}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {event.description}
                  </p>
                </div>
              </DropdownMenuSubTrigger>
              {renderUserSearch(event)}
            </DropdownMenuSub>
          ) : (
            <DropdownMenuItem
              key={event.type}
              onClick={() => handleSimulate(event)}
              disabled={isSimulating}
              className="flex items-center gap-3 py-2"
            >
              {event.icon}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{event.label}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {event.description}
                </p>
              </div>
              {isSimulating && <Loader2 className="h-4 w-4 animate-spin" />}
            </DropdownMenuItem>
          )
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
