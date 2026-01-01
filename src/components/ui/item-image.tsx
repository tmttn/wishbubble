"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface ItemImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
}

export function ItemImage({ src, alt, className, containerClassName }: ItemImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className={cn(
        "relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted shadow-sm flex items-center justify-center",
        containerClassName
      )}>
        <ImageOff className="h-6 w-6 text-muted-foreground/50" />
      </div>
    );
  }

  return (
    <div className={cn(
      "relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted shadow-sm",
      containerClassName
    )}>
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
