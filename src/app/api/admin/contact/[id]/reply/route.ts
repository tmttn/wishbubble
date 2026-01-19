import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin";
import { queueContactReply } from "@/lib/email/queue";
import { logger } from "@/lib/logger";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/admin/contact/[id]/reply - Send a reply to a contact submission
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const adminResult = await requireAdminApi();
    if (adminResult.error) {
      return NextResponse.json(
        { error: adminResult.error },
        { status: adminResult.status }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { message } = body;

    // Validate message
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Reply message is required" },
        { status: 400 }
      );
    }

    if (message.length > 10000) {
      return NextResponse.json(
        { error: "Reply message is too long" },
        { status: 400 }
      );
    }

    // Get the contact submission
    const submission = await prisma.contactSubmission.findUnique({
      where: { id },
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Contact submission not found" },
        { status: 404 }
      );
    }

    // Get admin user info (session is guaranteed non-null here since error is null)
    const admin = await prisma.user.findUnique({
      where: { id: adminResult.session!.user.id },
      select: { email: true, name: true },
    });

    if (!admin?.email) {
      return NextResponse.json(
        { error: "Admin email not found" },
        { status: 500 }
      );
    }

    // Send the reply email
    const result = await queueContactReply({
      to: submission.email,
      senderName: submission.name,
      subject: submission.subject,
      originalMessage: submission.message,
      replyMessage: message.trim(),
      replyFrom: admin.email,
      locale: submission.locale,
    });

    if (!result.success) {
      logger.error("[Contact Reply] Failed to send email", result.error);
      return NextResponse.json(
        { error: "Failed to send reply email" },
        { status: 500 }
      );
    }

    const adminName = admin.name || admin.email;

    // Update the submission status to IN_PROGRESS if it's NEW
    if (submission.status === "NEW") {
      await prisma.contactSubmission.update({
        where: { id },
        data: { status: "IN_PROGRESS" },
      });
    }

    // Create a comment record for the reply
    const comment = await prisma.contactComment.create({
      data: {
        submissionId: id,
        authorId: adminResult.session!.user.id,
        authorName: adminName,
        content: message.trim(),
        type: "REPLY",
      },
    });

    return NextResponse.json({ success: true, comment });
  } catch (error) {
    logger.error("Error sending contact reply", error);
    return NextResponse.json(
      { error: "Failed to send reply" },
      { status: 500 }
    );
  }
}
