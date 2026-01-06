"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff, Package, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ImageSize = "xs" | "sm" | "md" | "lg" | "xl";

const sizeConfig: Record<ImageSize, { container: string; icon: string }> = {
  xs: { container: "h-10 w-10", icon: "h-4 w-4" },
  sm: { container: "h-12 w-12", icon: "h-5 w-5" },
  md: { container: "h-16 w-16", icon: "h-6 w-6" },
  lg: { container: "h-20 w-20", icon: "h-8 w-8" },
  xl: { container: "h-24 w-24", icon: "h-10 w-10" },
};

interface ItemImageProps {
  src?: string | null;
  alt: string;
  size?: ImageSize;
  className?: string;
  containerClassName?: string;
  fallbackIcon?: LucideIcon;
  rounded?: "sm" | "md" | "lg" | "xl" | "full";
}

export function ItemImage({
  src,
  alt,
  size = "md",
  className,
  containerClassName,
  fallbackIcon: FallbackIcon = Package,
  rounded = "md",
}: ItemImageProps) {
  const [hasError, setHasError] = useState(false);
  const { container, icon } = sizeConfig[size];
  const roundedClass = `rounded-${rounded}`;

  if (!src || hasError) {
    return (
      <div
        className={cn(
          "relative shrink-0 overflow-hidden bg-muted flex items-center justify-center",
          container,
          roundedClass,
          containerClassName
        )}
      >
        <FallbackIcon className={cn(icon, "text-muted-foreground/50")} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden bg-muted",
        container,
        roundedClass,
        containerClassName
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className={cn("object-cover", className)}
        onError={() => setHasError(true)}
      />
    </div>
  );
}
