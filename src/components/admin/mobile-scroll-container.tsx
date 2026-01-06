"use client";

import { cn } from "@/lib/utils";

interface MobileScrollContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileScrollContainer({
  children,
  className,
}: MobileScrollContainerProps) {
  return (
    <div
      className={cn(
        "flex gap-2 sm:gap-4 sm:flex-wrap",
        "overflow-x-auto sm:overflow-visible",
        "-mx-4 px-4 sm:mx-0 sm:px-0",
        "pb-2 sm:pb-0",
        "scrollbar-hide",
        className
      )}
    >
      {children}
    </div>
  );
}
