"use client";

import * as React from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface DetailPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

interface DetailPanelContentProps {
  children: React.ReactNode;
  className?: string;
}

interface DetailPanelHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface DetailPanelTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface DetailPanelDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

interface DetailPanelBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface DetailPanelFooterProps {
  children: React.ReactNode;
  className?: string;
}

interface DetailPanelSectionProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  icon?: React.ReactNode;
  count?: number;
}

const DetailPanelContext = React.createContext<{
  isDesktop: boolean;
}>({ isDesktop: true });

export function DetailPanel({ open, onOpenChange, children }: DetailPanelProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <DetailPanelContext.Provider value={{ isDesktop }}>
        <Sheet open={open} onOpenChange={onOpenChange}>
          {children}
        </Sheet>
      </DetailPanelContext.Provider>
    );
  }

  return (
    <DetailPanelContext.Provider value={{ isDesktop }}>
      <Drawer open={open} onOpenChange={onOpenChange}>
        {children}
      </Drawer>
    </DetailPanelContext.Provider>
  );
}

export function DetailPanelContent({ children, className }: DetailPanelContentProps) {
  const { isDesktop } = React.useContext(DetailPanelContext);

  if (isDesktop) {
    return (
      <SheetContent
        side="right"
        className={cn(
          "w-[480px] p-0 gap-0 border-l border-border/50",
          "bg-background",
          "[&>button]:top-4 [&>button]:right-4 [&>button]:z-50",
          "[&>button]:h-8 [&>button]:w-8 [&>button]:rounded-full",
          "[&>button]:bg-muted [&>button]:opacity-100",
          "[&>button]:hover:bg-muted/80 [&>button]:transition-colors",
          "[&>button]:flex [&>button]:items-center [&>button]:justify-center",
          className
        )}
        aria-describedby={undefined}
      >
        <SheetTitle className="sr-only">Details</SheetTitle>
        <div className="flex flex-col h-full">
          {children}
        </div>
      </SheetContent>
    );
  }

  return (
    <DrawerContent className={cn("max-h-[90dvh] bg-background", className)} aria-describedby={undefined}>
      <DrawerTitle className="sr-only">Details</DrawerTitle>
      <div className="flex flex-col h-full overflow-auto pb-safe">
        {children}
      </div>
    </DrawerContent>
  );
}

export function DetailPanelHeader({ children, className }: DetailPanelHeaderProps) {
  const { isDesktop } = React.useContext(DetailPanelContext);

  if (isDesktop) {
    return (
      <SheetHeader
        className={cn(
          "p-6 pr-14 pb-4 border-b border-border/50",
          "bg-muted/30",
          className
        )}
      >
        {children}
      </SheetHeader>
    );
  }

  return (
    <DrawerHeader
      className={cn(
        "p-4 pb-3 border-b border-border/50 text-left",
        "bg-muted/30",
        className
      )}
    >
      {children}
    </DrawerHeader>
  );
}

export function DetailPanelTitle({ children, className }: DetailPanelTitleProps) {
  const { isDesktop } = React.useContext(DetailPanelContext);

  if (isDesktop) {
    return (
      <SheetTitle
        className={cn(
          "text-xl font-bold font-display",
          "bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text",
          className
        )}
      >
        {children}
      </SheetTitle>
    );
  }

  return (
    <DrawerTitle
      className={cn(
        "text-lg font-bold font-display",
        className
      )}
    >
      {children}
    </DrawerTitle>
  );
}

export function DetailPanelDescription({ children, className }: DetailPanelDescriptionProps) {
  const { isDesktop } = React.useContext(DetailPanelContext);

  if (isDesktop) {
    return (
      <SheetDescription className={cn("text-muted-foreground", className)}>
        {children}
      </SheetDescription>
    );
  }

  return (
    <DrawerDescription className={cn("text-muted-foreground", className)}>
      {children}
    </DrawerDescription>
  );
}

export function DetailPanelBody({ children, className }: DetailPanelBodyProps) {
  return (
    <ScrollArea className="flex-1">
      <div className={cn("p-6 pt-4", className)}>
        {children}
      </div>
    </ScrollArea>
  );
}

export function DetailPanelFooter({ children, className }: DetailPanelFooterProps) {
  return (
    <div
      className={cn(
        "shrink-0 p-6 pt-4",
        "border-t border-border/50",
        "bg-background",
        className
      )}
    >
      {children}
    </div>
  );
}

export function DetailPanelSection({
  children,
  className,
  title,
  icon,
  count
}: DetailPanelSectionProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {title && (
        <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground/90">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          <span>{title}</span>
          {count !== undefined && (
            <span className="text-xs font-normal text-muted-foreground">
              ({count})
            </span>
          )}
        </h3>
      )}
      {children}
    </div>
  );
}

export function DetailPanelCard({
  children,
  className,
  onClick,
  interactive = false,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
}) {
  const Component = onClick ? "button" : "div";

  return (
    <Component
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-lg p-3",
        "bg-muted/50 border border-border",
        interactive && "hover:bg-muted hover:border-border transition-all cursor-pointer",
        onClick && "hover:bg-muted hover:border-border transition-all cursor-pointer",
        className
      )}
    >
      {children}
    </Component>
  );
}

export function DetailPanelStat({
  label,
  value,
  icon,
  className,
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg",
      "bg-muted/50 border border-border",
      className
    )}>
      {icon && (
        <div className="text-muted-foreground">
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

export function DetailPanelAlert({
  children,
  variant = "warning",
  icon,
  className,
}: {
  children: React.ReactNode;
  variant?: "warning" | "error" | "success" | "info";
  icon?: React.ReactNode;
  className?: string;
}) {
  const variantStyles = {
    warning: "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400",
    error: "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400",
    success: "bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400",
    info: "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400",
  };

  return (
    <div className={cn(
      "rounded-xl p-3 border",
      variantStyles[variant],
      className
    )}>
      <div className="flex items-start gap-2">
        {icon && <span className="flex-shrink-0 mt-0.5">{icon}</span>}
        <div className="text-sm min-w-0">{children}</div>
      </div>
    </div>
  );
}
