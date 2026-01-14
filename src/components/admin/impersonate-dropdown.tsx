"use client";

import { useState, useEffect, useCallback } from "react";
import { useTypedTranslations } from "@/i18n/useTypedTranslations";
import { useDebouncedCallback } from "use-debounce";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  UserCircle,
  ChevronDown,
  Search,
  Loader2,
  ExternalLink,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  name: string | null;
  email: string;
  image?: string | null;
  lastImpersonated?: string;
}

interface SearchResult {
  type: "user";
  id: string;
  title: string;
  subtitle?: string;
  url: string;
  meta?: Record<string, string | number | boolean>;
}

export function ImpersonateDropdown() {
  const t = useTypedTranslations("admin.nav");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [impersonatingUserId, setImpersonatingUserId] = useState<string | null>(null);

  // Load recent impersonations when dropdown opens
  useEffect(() => {
    if (open) {
      loadRecentUsers();
    }
  }, [open]);

  const loadRecentUsers = async () => {
    try {
      const res = await fetch("/api/admin/impersonate");
      if (res.ok) {
        const data = await res.json();
        setRecentUsers(data.recentUsers || []);
      }
    } catch (error) {
      console.error("Failed to load recent impersonations:", error);
    }
  };

  // Debounced search
  const searchUsers = useDebouncedCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    try {
      // Use the admin search API but filter to users only
      const res = await fetch(
        `/api/admin/search?q=${encodeURIComponent(searchQuery)}&limit=5&types=user`
      );
      if (res.ok) {
        const data = await res.json();
        // Transform search results to user format
        const users: User[] = (data.results || [])
          .filter((r: SearchResult) => r.type === "user")
          .map((r: SearchResult) => ({
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

  const handleImpersonate = async (user: User) => {
    setImpersonatingUserId(user.id);
    setIsLoading(true);

    try {
      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to create impersonation session");
        return;
      }

      // Open the impersonation URL in a new tab
      window.open(data.url, "_blank");
      toast.success(`Opening app as ${user.name || user.email}`);
      setOpen(false);
    } catch (error) {
      console.error("Impersonation error:", error);
      toast.error("Failed to start impersonation");
    } finally {
      setIsLoading(false);
      setImpersonatingUserId(null);
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

  const hasResults = searchResults.length > 0;
  const showRecent = !query || query.length < 2;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 w-full md:w-auto justify-start md:justify-center">
          <UserCircle className="h-4 w-4" />
          <span>{t("impersonate")}</span>
          <ChevronDown className="h-3 w-3 opacity-50 ml-auto md:ml-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-w-[calc(100vw-2rem)]">
        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Loading state */}
        {isSearching && (
          <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Searching...
          </div>
        )}

        {/* Search results */}
        {!isSearching && hasResults && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Search Results
            </DropdownMenuLabel>
            {searchResults.map((user) => (
              <DropdownMenuItem
                key={user.id}
                onClick={() => handleImpersonate(user)}
                disabled={isLoading}
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
                {impersonatingUserId === user.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                )}
              </DropdownMenuItem>
            ))}
          </>
        )}

        {/* No results */}
        {!isSearching && query.length >= 2 && !hasResults && (
          <div className="py-4 text-center text-sm text-muted-foreground">
            No users found
          </div>
        )}

        {/* Recent impersonations */}
        {showRecent && !isSearching && (
          <>
            {recentUsers.length > 0 ? (
              <>
                <DropdownMenuLabel className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Recent
                </DropdownMenuLabel>
                {recentUsers.map((user) => (
                  <DropdownMenuItem
                    key={user.id}
                    onClick={() => handleImpersonate(user)}
                    disabled={isLoading}
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
                    {impersonatingUserId === user.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    )}
                  </DropdownMenuItem>
                ))}
              </>
            ) : (
              <div className="py-4 text-center text-sm text-muted-foreground">
                Search for a user to impersonate
              </div>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
