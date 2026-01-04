"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { format, isToday, isYesterday } from "date-fns";
import { PremiumAvatar } from "@/components/ui/premium-avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, Send, MoreVertical, Trash2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  mentions?: string[];
  user: {
    id: string;
    name: string | null;
    image: string | null;
    avatarUrl: string | null;
    subscriptionTier: string;
  };
}

interface BubbleMember {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  image: string | null;
}

interface BubbleChatProps {
  bubbleId: string;
  currentUserId: string;
  isAdmin: boolean;
  members: BubbleMember[];
}

// Track mentions: maps display name to user ID
interface MentionMap {
  [displayName: string]: string;
}

export function BubbleChat({ bubbleId, currentUserId, isAdmin, members }: BubbleChatProps) {
  const t = useTranslations("bubbles.chat");
  const tCommon = useTranslations("common");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [pendingMentions, setPendingMentions] = useState<MentionMap>({});
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionIndex, setMentionIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const latestMessageIdRef = useRef<string | null>(null);
  const isPollingRef = useRef(false);

  // Filter members for mention suggestions (exclude self)
  const mentionableMembers = members.filter((m) => m.id !== currentUserId);
  const filteredMentions = mentionableMembers.filter((m) =>
    m.name?.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const fetchMessages = useCallback(async (cursor?: string) => {
    try {
      const url = cursor
        ? `/api/bubbles/${bubbleId}/messages?cursor=${cursor}`
        : `/api/bubbles/${bubbleId}/messages`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch messages");
      const data = await response.json();
      return data;
    } catch (error) {
      toast.error(t("fetchError"));
      return { messages: [], hasMore: false };
    }
  }, [bubbleId, t]);

  // Mark messages as read
  const markAsRead = useCallback(async () => {
    try {
      await fetch(`/api/bubbles/${bubbleId}/messages/read`, {
        method: "POST",
      });
    } catch {
      // Silent fail - not critical
    }
  }, [bubbleId]);

  // Fetch new messages (for polling)
  const fetchNewMessages = useCallback(async (afterId: string) => {
    try {
      const response = await fetch(`/api/bubbles/${bubbleId}/messages?after=${afterId}`);
      if (!response.ok) return [];
      const data = await response.json();
      return data.messages || [];
    } catch {
      return [];
    }
  }, [bubbleId]);

  // Update latest message ID ref when messages change
  useEffect(() => {
    if (messages.length > 0) {
      latestMessageIdRef.current = messages[messages.length - 1].id;
    }
  }, [messages]);

  useEffect(() => {
    const loadMessages = async () => {
      setIsLoading(true);
      const data = await fetchMessages();
      // Messages come in chronological order from API (oldest first)
      const loadedMessages = data.messages;
      setMessages(loadedMessages);
      setHasMore(data.hasMore);
      if (loadedMessages.length > 0) {
        latestMessageIdRef.current = loadedMessages[loadedMessages.length - 1].id;
      }
      setIsLoading(false);
      // Scroll to bottom after initial load
      setTimeout(scrollToBottom, 100);
      // Mark messages as read
      markAsRead();
    };
    loadMessages();
  }, [fetchMessages, scrollToBottom, markAsRead]);

  // Poll for new messages
  useEffect(() => {
    if (isLoading) return;

    const POLL_INTERVAL = 5000; // 5 seconds
    let pollTimer: NodeJS.Timeout;

    const pollForNewMessages = async () => {
      // Skip if already polling or no messages yet
      if (isPollingRef.current || !latestMessageIdRef.current) return;

      isPollingRef.current = true;

      try {
        const newMessages = await fetchNewMessages(latestMessageIdRef.current);

        if (newMessages.length > 0) {
          // Filter out any messages we already have and messages from self (already added optimistically)
          setMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id));
            const trulyNewMessages = newMessages.filter(
              (m: ChatMessage) => !existingIds.has(m.id)
            );

            if (trulyNewMessages.length > 0) {
              // Check if user is scrolled near bottom
              const container = messagesContainerRef.current;
              const isNearBottom = container
                ? container.scrollHeight - container.scrollTop - container.clientHeight < 100
                : true;

              // Update latest message ID
              latestMessageIdRef.current = trulyNewMessages[trulyNewMessages.length - 1].id;

              // If near bottom, scroll to show new messages
              if (isNearBottom) {
                setTimeout(scrollToBottom, 100);
              }

              // Mark as read if we received new messages
              markAsRead();

              return [...prev, ...trulyNewMessages];
            }
            return prev;
          });
        }
      } finally {
        isPollingRef.current = false;
      }
    };

    // Handle visibility change to pause/resume polling
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Poll immediately when tab becomes visible
        pollForNewMessages();
      }
    };

    // Start polling
    pollTimer = setInterval(pollForNewMessages, POLL_INTERVAL);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(pollTimer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isLoading, fetchNewMessages, scrollToBottom, markAsRead]);

  const loadMoreMessages = async () => {
    if (isLoadingMore || !hasMore || messages.length === 0) return;

    setIsLoadingMore(true);
    const oldestMessage = messages[0];
    const data = await fetchMessages(oldestMessage.id);
    // Prepend older messages (already in chronological order from API)
    setMessages(prev => [...data.messages, ...prev]);
    setHasMore(data.hasMore);
    setIsLoadingMore(false);
  };

  // Convert clean @Name format to @[Name](userId) format using pending mentions
  const convertMentionsToFullFormat = useCallback((content: string, mentions: MentionMap): string => {
    let result = content;
    // Sort by name length descending to avoid partial replacements
    const sortedNames = Object.keys(mentions).sort((a, b) => b.length - a.length);
    for (const name of sortedNames) {
      const userId = mentions[name];
      // Match @Name followed by space, punctuation, or end of string
      const pattern = new RegExp(`@${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=\\s|$|[.,!?;:])`, 'g');
      result = result.replace(pattern, `@[${name}](${userId})`);
    }
    return result;
  }, []);

  // Extract mention user IDs from message content (full format)
  const extractMentions = useCallback((content: string): string[] => {
    const mentionPattern = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const mentions: string[] = [];
    let match;
    while ((match = mentionPattern.exec(content)) !== null) {
      mentions.push(match[2]); // User ID is in second capture group
    }
    return mentions;
  }, []);

  // Convert mention format to display format
  const formatMessageContent = useCallback((content: string, isOwnMessage: boolean): React.ReactNode => {
    const parts = content.split(/(@\[[^\]]+\]\([^)]+\))/g);
    return parts.map((part, i) => {
      const mentionMatch = part.match(/@\[([^\]]+)\]\(([^)]+)\)/);
      if (mentionMatch) {
        const [, name] = mentionMatch;
        return (
          <span
            key={i}
            className={cn(
              "font-semibold",
              isOwnMessage ? "text-primary-foreground underline" : "text-primary"
            )}
          >
            @{name}
          </span>
        );
      }
      return part;
    });
  }, []);

  // Handle mention selection
  const insertMention = useCallback((member: BubbleMember) => {
    const textarea = textareaRef.current;
    if (!textarea || !member.name) return;

    const text = newMessage;
    // Find the @ symbol before cursor
    const beforeCursor = text.substring(0, cursorPosition);
    const lastAtIndex = beforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      // Display clean @Name format in textarea
      const mention = `@${member.name} `;
      const newText = text.substring(0, lastAtIndex) + mention + text.substring(cursorPosition);
      setNewMessage(newText);

      // Track this mention for later conversion
      setPendingMentions(prev => ({
        ...prev,
        [member.name!]: member.id,
      }));

      // Move cursor after mention
      const newCursorPos = lastAtIndex + mention.length;
      setTimeout(() => {
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        textarea.focus();
      }, 0);
    }

    setShowMentions(false);
    setMentionQuery("");
    setMentionIndex(0);
  }, [newMessage, cursorPosition]);

  const handleSendMessage = async () => {
    const rawContent = newMessage.trim();
    if (!rawContent || isSending) return;

    // Convert @Name to @[Name](userId) format for storage
    const content = convertMentionsToFullFormat(rawContent, pendingMentions);

    setIsSending(true);
    setNewMessage("");
    setPendingMentions({});
    setShowMentions(false);

    try {
      // Extract mention IDs from the converted message
      const mentions = extractMentions(content);

      const response = await fetch(`/api/bubbles/${bubbleId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, mentions }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t("sendError"));
      }

      const newMsg = await response.json();
      setMessages(prev => [...prev, newMsg]);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("sendError"));
      setNewMessage(rawContent); // Restore message on error (clean format)
    } finally {
      setIsSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const response = await fetch(`/api/bubbles/${bubbleId}/messages/${messageId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t("deleteError"));
      }

      setMessages(prev => prev.filter(m => m.id !== messageId));
      toast.success(t("messageDeleted"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("deleteError"));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showMentions && filteredMentions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex((prev) => (prev + 1) % filteredMentions.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex((prev) => (prev - 1 + filteredMentions.length) % filteredMentions.length);
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(filteredMentions[mentionIndex]);
      } else if (e.key === "Escape") {
        setShowMentions(false);
        setMentionQuery("");
      }
      return;
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const selectionStart = e.target.selectionStart ?? value.length;
    setNewMessage(value);
    setCursorPosition(selectionStart);

    // Check for @ mention trigger
    const beforeCursor = value.substring(0, selectionStart);
    const lastAtIndex = beforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const afterAt = beforeCursor.substring(lastAtIndex + 1);
      // Show mentions if @ is at start or after a space/newline, and no space after @
      const charBeforeAt = lastAtIndex > 0 ? beforeCursor[lastAtIndex - 1] : " ";
      const isValidTrigger = charBeforeAt === " " || charBeforeAt === "\n" || lastAtIndex === 0;
      const hasNoSpaceAfter = !afterAt.includes(" ");

      if (isValidTrigger && hasNoSpaceAfter) {
        setMentionQuery(afterAt);
        setShowMentions(true);
        setMentionIndex(0);
        return;
      }
    }

    setShowMentions(false);
    setMentionQuery("");
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatMessageDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) {
      return format(date, "HH:mm");
    }
    if (isYesterday(date)) {
      return `${t("yesterday")} ${format(date, "HH:mm")}`;
    }
    return format(date, "MMM d, HH:mm");
  };

  const getAvatarGradient = (name: string | null) => {
    const gradients = [
      "from-primary to-primary/70",
      "from-primary/80 to-accent",
      "from-accent to-accent/70",
      "from-accent/80 to-primary",
      "from-primary/60 to-accent/80",
      "from-accent/60 to-primary/80",
    ];
    const index = name ? name.charCodeAt(0) % gradients.length : 0;
    return gradients[index];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[500px] border rounded-lg bg-background">
      {/* Messages container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {/* Load more button */}
        {hasMore && (
          <div className="text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadMoreMessages}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {t("loadMore")}
            </Button>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-medium text-muted-foreground">{t("noMessages.title")}</h3>
            <p className="text-sm text-muted-foreground/70 mt-1">
              {t("noMessages.description")}
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.user.id === currentUserId;
            const canDelete = isOwn || isAdmin;
            const gradient = getAvatarGradient(message.user.name);

            return (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 group",
                  isOwn && "flex-row-reverse"
                )}
              >
                {!isOwn && (
                  <div className={`shrink-0 p-0.5 rounded-full bg-gradient-to-br ${gradient} h-fit`}>
                    <PremiumAvatar
                      src={message.user.image || message.user.avatarUrl}
                      fallback={getInitials(message.user.name)}
                      isPremium={message.user.subscriptionTier !== "FREE"}
                      size="sm"
                      className="border-2 border-background"
                      fallbackClassName={`bg-gradient-to-br ${gradient}`}
                    />
                  </div>
                )}

                <div className={cn("flex flex-col max-w-[70%]", isOwn && "items-end")}>
                  {!isOwn && (
                    <span className="text-xs text-muted-foreground mb-1">
                      {message.user.name}
                    </span>
                  )}
                  <div className="flex items-start gap-1">
                    {isOwn && canDelete && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                          >
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleDeleteMessage(message.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {tCommon("delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-2 text-sm",
                        isOwn
                          ? "bg-primary text-primary-foreground rounded-tr-sm"
                          : "bg-muted rounded-tl-sm"
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">{formatMessageContent(message.content, isOwn)}</p>
                    </div>
                    {!isOwn && canDelete && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                          >
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem
                            onClick={() => handleDeleteMessage(message.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {tCommon("delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1">
                    {formatMessageDate(message.createdAt)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="border-t p-4">
        <div className="relative">
          {/* Mention suggestions dropdown */}
          {showMentions && filteredMentions.length > 0 && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-popover border rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
              {filteredMentions.map((member, index) => (
                <button
                  key={member.id}
                  type="button"
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-accent transition-colors",
                    index === mentionIndex && "bg-accent"
                  )}
                  onClick={() => insertMention(member)}
                >
                  <PremiumAvatar
                    src={member.image || member.avatarUrl}
                    fallback={getInitials(member.name)}
                    isPremium={false}
                    size="sm"
                  />
                  <span className="text-sm font-medium">{member.name}</span>
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={newMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={t("placeholder")}
              className="min-h-[44px] max-h-32 resize-none"
              rows={1}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isSending}
              size="icon"
              className="shrink-0 h-11 w-11"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {t("mentionHint")}
          </p>
        </div>
      </div>
    </div>
  );
}
