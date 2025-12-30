"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Mail, Plus, X, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const inviteSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type InviteInput = z.infer<typeof inviteSchema>;

interface InviteResult {
  email: string;
  status: "sent" | "already_member" | "already_invited" | "email_failed";
}

interface InvitePageProps {
  params: Promise<{ id: string }>;
}

export default function InvitePage({ params }: InvitePageProps) {
  const { id: bubbleId } = use(params);
  const router = useRouter();
  const [emails, setEmails] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<InviteResult[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteInput>({
    resolver: zodResolver(inviteSchema),
  });

  const addEmail = (data: InviteInput) => {
    if (!emails.includes(data.email)) {
      setEmails([...emails, data.email]);
    }
    reset();
  };

  const removeEmail = (email: string) => {
    setEmails(emails.filter((e) => e !== email));
  };

  const sendInvitations = async () => {
    if (emails.length === 0) {
      toast.error("Please add at least one email address");
      return;
    }

    setIsLoading(true);
    setResults([]);

    try {
      const response = await fetch(`/api/bubbles/${bubbleId}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send invitations");
      }

      const data = await response.json();
      setResults(data.results);

      const sentCount = data.results.filter(
        (r: InviteResult) => r.status === "sent"
      ).length;

      if (sentCount > 0) {
        toast.success(`${sentCount} invitation(s) sent successfully!`);
        setEmails([]);
      } else {
        toast.info("No new invitations were sent");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send invitations"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <Check className="h-4 w-4 text-green-500" />;
      case "already_member":
      case "already_invited":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <X className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "sent":
        return "Invitation sent";
      case "already_member":
        return "Already a member";
      case "already_invited":
        return "Already invited";
      case "email_failed":
        return "Failed to send email";
      default:
        return status;
    }
  };

  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/bubbles/${bubbleId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Bubble
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Invite Members
          </CardTitle>
          <CardDescription>
            Send email invitations to add people to your bubble
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email input */}
          <form onSubmit={handleSubmit(addEmail)} className="flex gap-2">
            <div className="flex-1">
              <Input
                type="email"
                placeholder="Enter email address"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-destructive mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>
            <Button type="submit" variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </form>

          {/* Email list */}
          {emails.length > 0 && (
            <div className="space-y-2">
              <Label>Emails to invite ({emails.length})</Label>
              <div className="flex flex-wrap gap-2">
                {emails.map((email) => (
                  <Badge key={email} variant="secondary" className="pr-1">
                    {email}
                    <button
                      onClick={() => removeEmail(email)}
                      className="ml-2 hover:bg-muted rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-2">
              <Label>Results</Label>
              <div className="space-y-2">
                {results.map((result) => (
                  <div
                    key={result.email}
                    className="flex items-center justify-between p-2 rounded border"
                  >
                    <span className="text-sm">{result.email}</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result.status)}
                      <span className="text-sm text-muted-foreground">
                        {getStatusText(result.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Send button */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={sendInvitations}
              disabled={emails.length === 0 || isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send {emails.length} Invitation{emails.length !== 1 ? "s" : ""}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
