"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AttachWishlistButtonProps {
  bubbleId: string;
  label: string;
  successMessage: string;
  errorMessage: string;
}

export function AttachWishlistButton({
  bubbleId,
  label,
  successMessage,
  errorMessage,
}: AttachWishlistButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleAttach = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/bubbles/${bubbleId}/attach-wishlist`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to attach wishlist");
      }

      toast.success(successMessage);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button size="sm" onClick={handleAttach} disabled={isLoading}>
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {label}
    </Button>
  );
}
