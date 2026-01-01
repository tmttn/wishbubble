import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin";
import { logger } from "@/lib/logger";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/contact/[id]/comments - Get all comments for a submission
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const adminResult = await requireAdminApi();
    if (adminResult.error) {
      return NextResponse.json(
        { error: adminResult.error },
        { status: adminResult.status }
      );
    }

    const { id } = await params;

    const comments = await prisma.contactComment.findMany({
      where: { submissionId: id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(comments);
  } catch (error) {
    logger.error("Error fetching comments", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// POST /api/admin/contact/[id]/comments - Add a note to a submission
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
    const { content } = body;

    // Validate content
    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Note content is required" },
        { status: 400 }
      );
    }

    if (content.length > 10000) {
      return NextResponse.json(
        { error: "Note is too long" },
        { status: 400 }
      );
    }

    // Verify submission exists
    const submission = await prisma.contactSubmission.findUnique({
      where: { id },
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Contact submission not found" },
        { status: 404 }
      );
    }

    // Get admin user info
    const admin = await prisma.user.findUnique({
      where: { id: adminResult.session!.user.id },
      select: { name: true, email: true },
    });

    const adminName = admin?.name || admin?.email || "Admin";

    // Create the comment
    const comment = await prisma.contactComment.create({
      data: {
        submissionId: id,
        authorId: adminResult.session!.user.id,
        authorName: adminName,
        content: content.trim(),
        type: "NOTE",
      },
    });

    return NextResponse.json(comment);
  } catch (error) {
    logger.error("Error adding note", error);
    return NextResponse.json(
      { error: "Failed to add note" },
      { status: 500 }
    );
  }
}
