"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface PremiumAvatarProps {
  src?: string | null;
  fallback: string;
  isPremium?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  fallbackClassName?: string;
}

const sizeClasses = {
  sm: "h-7 w-7",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

const crownSizeClasses = {
  sm: "h-3 w-3 -bottom-0.5 -right-0.5",
  md: "h-4 w-4 -bottom-0.5 -right-0.5",
  lg: "h-5 w-5 -bottom-1 -right-1",
};

const fallbackTextClasses = {
  sm: "text-[10px]",
  md: "text-sm",
  lg: "text-base",
};

export function PremiumAvatar({
  src,
  fallback,
  isPremium = false,
  size = "md",
  className,
  fallbackClassName,
}: PremiumAvatarProps) {
  return (
    <div className="relative inline-flex">
      <Avatar className={cn(sizeClasses[size], className)}>
        <AvatarImage src={src || undefined} />
        <AvatarFallback
          className={cn(
            "bg-gradient-to-br from-primary to-accent text-white font-medium",
            fallbackTextClasses[size],
            fallbackClassName
          )}
        >
          {fallback}
        </AvatarFallback>
      </Avatar>
      {isPremium && (
        <div
          className={cn(
            "absolute flex items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-sm ring-2 ring-background",
            crownSizeClasses[size]
          )}
        >
          <Crown className={size === "sm" ? "h-2 w-2" : size === "md" ? "h-2.5 w-2.5" : "h-3 w-3"} />
        </div>
      )}
    </div>
  );
}
