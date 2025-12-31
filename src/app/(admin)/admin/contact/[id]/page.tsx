"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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
  Calendar,
  Globe,
  Shield,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Ban,
  Send,
  MessageSquare,
  StickyNote,
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

type ContactCommentType = "NOTE" | "REPLY";

interface ContactComment {
  id: string;
  authorName: string;
  content: string;
  type: ContactCommentType;
  createdAt: string;
}

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: ContactSubject;
  message: string;
  locale: string;
  ipAddress: string | null;
  userAgent: string | null;
  recaptchaScore: number | null;
  status: ContactStatus;
  handledBy: string | null;
  handledAt: string | null;
  comments: ContactComment[];
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
  const [submission, setSubmission] = useState<ContactSubmission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<ContactStatus>("NEW");
  const [replyMessage, setReplyMessage] = useState("");
  const [noteMessage, setNoteMessage] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);

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
      } catch (error) {
        console.error("Error fetching contact submission:", error);
        toast.error("Failed to load contact submission");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubmission();
  }, [params.id]);

  const handleStatusChange = async (newStatus: ContactStatus) => {
    setStatus(newStatus);
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/contact/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update");
      }

      const updated = await response.json();
      setSubmission(updated);
      toast.success("Status updated");
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim()) {
      toast.error("Please enter a reply message");
      return;
    }

    setIsSendingReply(true);
    try {
      const response = await fetch(`/api/admin/contact/${params.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: replyMessage }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send reply");
      }

      toast.success("Reply sent successfully");
      setReplyMessage("");

      // Refresh the submission to get updated comments
      const refreshResponse = await fetch(`/api/admin/contact/${params.id}`);
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setSubmission(data);
        setStatus(data.status);
      }
    } catch (error) {
      console.error("Error sending reply:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send reply");
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteMessage.trim()) {
      toast.error("Please enter a note");
      return;
    }

    setIsAddingNote(true);
    try {
      const response = await fetch(`/api/admin/contact/${params.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: noteMessage }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add note");
      }

      toast.success("Note added");
      setNoteMessage("");

      // Refresh the submission to get updated comments
      const refreshResponse = await fetch(`/api/admin/contact/${params.id}`);
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setSubmission(data);
      }
    } catch (error) {
      console.error("Error adding note:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add note");
    } finally {
      setIsAddingNote(false);
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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-green-600 hover:text-green-700"
            onClick={() => handleStatusChange("RESOLVED")}
            disabled={isSaving || status === "RESOLVED"}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark as Resolved
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700"
            onClick={() => handleStatusChange("SPAM")}
            disabled={isSaving || status === "SPAM"}
          >
            <Ban className="h-4 w-4 mr-2" />
            Mark as Spam
          </Button>
        </div>
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

          {/* Reply form */}
          <Card className="border-0 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Reply to {submission.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Send a reply to {submission.email}. Your email address will be set as the reply-to address.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your reply..."
                rows={4}
              />
              <Button
                onClick={handleSendReply}
                disabled={isSendingReply || !replyMessage.trim()}
              >
                {isSendingReply ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Reply
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Add note form */}
          <Card className="border-0 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <StickyNote className="h-5 w-5" />
                Add Internal Note
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Add a private note about this submission (not visible to the sender).
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={noteMessage}
                onChange={(e) => setNoteMessage(e.target.value)}
                placeholder="Add a note..."
                rows={3}
              />
              <Button
                variant="secondary"
                onClick={handleAddNote}
                disabled={isAddingNote || !noteMessage.trim()}
              >
                {isAddingNote ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <StickyNote className="h-4 w-4 mr-2" />
                    Add Note
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Activity log */}
          {submission.comments.length > 0 && (
            <Card className="border-0 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Activity Log
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {submission.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className={`rounded-lg p-4 ${
                        comment.type === "REPLY"
                          ? "bg-primary/5 border-l-4 border-primary"
                          : "bg-muted/50 border-l-4 border-muted-foreground/30"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {comment.type === "REPLY" ? (
                          <Mail className="h-4 w-4 text-primary" />
                        ) : (
                          <StickyNote className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="font-medium text-sm">{comment.authorName}</span>
                        <Badge variant="outline" className="text-xs">
                          {comment.type === "REPLY" ? "Reply sent" : "Note"}
                        </Badge>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card className="border-0 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={status} onValueChange={(v) => handleStatusChange(v as ContactStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEW">New</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="SPAM">Spam</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

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
              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Language:</span>
                <span className="uppercase">{submission.locale}</span>
              </div>
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
