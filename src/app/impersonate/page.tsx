"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2, AlertCircle, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ImpersonatePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "error" | "success">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function performImpersonation() {
      if (!token) {
        setStatus("error");
        setError("No impersonation token provided");
        return;
      }

      try {
        // Use NextAuth signIn with the impersonate provider
        // This will validate the token and create a new session for the target user
        const result = await signIn("impersonate", {
          token,
          redirect: false,
        });

        if (result?.error) {
          setStatus("error");
          setError(result.error === "CredentialsSignin"
            ? "Invalid or expired impersonation token"
            : result.error);
          return;
        }

        if (!result?.ok) {
          setStatus("error");
          setError("Failed to start impersonation");
          return;
        }

        setStatus("success");

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      } catch (err) {
        console.error("Error during impersonation:", err);
        setStatus("error");
        setError("An unexpected error occurred");
      }
    }

    performImpersonation();
  }, [token, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-mesh flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-lg text-muted-foreground">Verifying impersonation token...</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-gradient-mesh flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Impersonation Failed</h1>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => router.push("/admin")} variant="outline">
            Return to Admin
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-mesh flex items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-md">
        <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
          <UserCircle className="h-8 w-8 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Impersonation Active</h1>
        <p className="text-muted-foreground">
          Session switched successfully. Redirecting to dashboard...
        </p>
        <div className="pt-4">
          <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
        </div>
      </div>
    </div>
  );
}
