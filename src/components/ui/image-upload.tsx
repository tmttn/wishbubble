"use client";

import { useState, useCallback, useRef } from "react";
import Image from "next/image";
import { useTypedTranslations } from "@/i18n/useTypedTranslations";
import { Upload, X, Loader2, ImageIcon, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
  className?: string;
}

export function ImageUpload({
  value,
  onChange,
  disabled = false,
  className,
}: ImageUploadProps) {
  const t = useTypedTranslations("imageUpload");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    async (file: File) => {
      setError(null);
      setIsUploading(true);

      try {
        // Client-side validation
        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!allowedTypes.includes(file.type)) {
          setError(t("invalidType"));
          setIsUploading(false);
          return;
        }

        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
          setError(t("fileTooLarge"));
          setIsUploading(false);
          return;
        }

        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Upload failed");
        }

        const data = await response.json();
        onChange(data.url);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("uploadFailed"));
      } finally {
        setIsUploading(false);
      }
    },
    [onChange, t]
  );

  const handleRemove = useCallback(async () => {
    if (!value) return;

    // Only delete if it's a blob URL (uploaded by us)
    if (value.includes("blob.vercel-storage.com")) {
      try {
        await fetch("/api/upload", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: value }),
        });
      } catch {
        // Silently fail delete - image will be orphaned but that's ok
      }
    }

    onChange(null);
    setError(null);
  }, [value, onChange]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  }, [disabled, isUploading]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled || isUploading) return;

      const file = e.dataTransfer.files[0];
      if (file) {
        handleUpload(file);
      }
    },
    [disabled, isUploading, handleUpload]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleUpload(file);
      }
      // Reset input so same file can be selected again
      e.target.value = "";
    },
    [handleUpload]
  );

  const handleClick = useCallback(() => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  }, [disabled, isUploading]);

  return (
    <div className={cn("space-y-2", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {value ? (
        <div className="relative group">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
            <Image
              src={value}
              alt="Uploaded image"
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 400px"
            />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleRemove}
            disabled={disabled || isUploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50",
            (disabled || isUploading) && "opacity-50 cursor-not-allowed"
          )}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t("uploading")}</span>
            </>
          ) : (
            <>
              <div className="rounded-full bg-muted p-3">
                {isDragging ? (
                  <Upload className="h-6 w-6 text-primary" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="text-center">
                <span className="text-sm font-medium">{t("dragAndDrop")}</span>
                <span className="text-sm text-muted-foreground"> {t("or")} </span>
                <span className="text-sm font-medium text-primary">{t("browse")}</span>
              </div>
              <span className="text-xs text-muted-foreground">{t("supportedFormats")}</span>
            </>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
