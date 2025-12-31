"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Mail,
  User,
  Calendar,
  Globe,
  Shield,
  Loader2,
  Save,
  AlertCircle,
  CheckCircle,
  Clock,
  Ban,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

type ContactStatus = "NEW" | "IN_PROGRESS" | "RESOLVED" | "SPAM";
type ContactSubject =
  | "PRIVACY_REQUEST"
  | "DATA_DELETION"
  | "DATA_EXPORT"
  | "BUG_REPORT"
  | "FEATURE_REQUEST"
  | "GENERAL_INQUIRY"
  | "OTHER";

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: ContactSubject;
  message: string;
  ipAddress: string | null;
  userAgent: string | null;
  recaptchaScore: number | null;
  status: ContactStatus;
  notes: string | null;
  handledBy: string | null;
  handledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const statusColors: Record<ContactStatus, string> = {
  NEW: "bg-blue-500",
  IN_PROGRESS: "bg-yellow-500",
  RESOLVED: "bg-green-500",
  SPAM: "bg-red-500",
};

const statusIcons: Record<ContactStatus, React.ReactNode> = {
  NEW: <AlertCircle className="h-4 w-4" />,
  IN_PROGRESS: <Clock className="h-4 w-4" />,
  RESOLVED: <CheckCircle className="h-4 w-4" />,
  SPAM: <Ban className="h-4 w-4" />,
};

const subjectLabels: Record<ContactSubject, string> = {
  PRIVACY_REQUEST: "Privacy Request (GDPR)",
  DATA_DELETION: "Request Data Deletion",
  DATA_EXPORT: "Request Data Export",
  BUG_REPORT: "Bug Report",
  FEATURE_REQUEST: "Feature Request",
  GENERAL_INQUIRY: "General Inquiry",
  OTHER: "Other",
};

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [submission, setSubmission] = useState<ContactSubmission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<ContactStatus>("NEW");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        const response = await fetch(`/api/admin/contact/${params.id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch");
        }
        const data = await response.json();
        setSubmission(data);
        setStatus(data.status);
        setNotes(data.notes || "");
      } catch (error) {
        console.error("Error fetching contact submission:", error);
        toast.error("Failed to load contact submission");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubmission();
  }, [params.id]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/contact/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes }),
      });

      if (!response.ok) {
        throw new Error("Failed to update");
      }

      const updated = await response.json();
      setSubmission(updated);
      toast.success("Contact submission updated");
    } catch (error) {
      console.error("Error updating contact submission:", error);
      toast.error("Failed to update contact submission");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="space-y-6">
        <Link href="/admin/contact">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Contact
          </Button>
        </Link>
        <Card className="border-0 bg-card/80 backdrop-blur-sm">
          <CardContent className="py-8 text-center text-muted-foreground">
            Contact submission not found
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/admin/contact">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Contact
          </Button>
        </Link>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main content */}
        <div className="md:col-span-2 space-y-6">
          {/* Header */}
          <Card className="border-0 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-start gap-4">
                <div
                  className={`rounded-full p-2 text-white ${statusColors[submission.status]}`}
                >
                  {statusIcons[submission.status]}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-2xl">{submission.name}</CardTitle>
                  <p className="text-muted-foreground">{submission.email}</p>
                </div>
                <Badge variant="outline" className="text-sm">
                  {subjectLabels[submission.subject]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap">{submission.message}</p>
              </div>
            </CardContent>
          </Card>

          {/* Admin notes */}
          <Card className="border-0 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Admin Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as ContactStatus)}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEW">New</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                    <SelectItem value="SPAM">Spam</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add internal notes about this submission..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Metadata */}
          <Card className="border-0 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Submitted:</span>
                <span>{new Date(submission.createdAt).toLocaleString()}</span>
              </div>
              {submission.handledAt && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Handled:</span>
                  <span>{new Date(submission.handledAt).toLocaleString()}</span>
                </div>
              )}
              {submission.recaptchaScore !== null && (
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">reCAPTCHA Score:</span>
                  <span
                    className={
                      submission.recaptchaScore >= 0.7
                        ? "text-green-600"
                        : submission.recaptchaScore >= 0.5
                          ? "text-yellow-600"
                          : "text-red-600"
                    }
                  >
                    {submission.recaptchaScore.toFixed(2)}
                  </span>
                </div>
              )}
              {submission.ipAddress && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">IP:</span>
                  <span className="font-mono text-xs">{submission.ipAddress}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card className="border-0 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <a href={`mailto:${submission.email}?subject=Re: ${subjectLabels[submission.subject]}`}>
                  <Mail className="h-4 w-4 mr-2" />
                  Reply via Email
                </a>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-green-600 hover:text-green-700"
                onClick={() => {
                  setStatus("RESOLVED");
                  handleSave();
                }}
                disabled={isSaving || status === "RESOLVED"}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Resolved
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-red-600 hover:text-red-700"
                onClick={() => {
                  setStatus("SPAM");
                  handleSave();
                }}
                disabled={isSaving || status === "SPAM"}
              >
                <Ban className="h-4 w-4 mr-2" />
                Mark as Spam
              </Button>
            </CardContent>
          </Card>

          {/* User Agent */}
          {submission.userAgent && (
            <Card className="border-0 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">User Agent</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs font-mono text-muted-foreground break-all">
                  {submission.userAgent}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
