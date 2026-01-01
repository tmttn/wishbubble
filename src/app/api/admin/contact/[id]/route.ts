import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ContactStatus } from "@prisma/client";
import { logger } from "@/lib/logger";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/contact/[id] - Get a specific contact submission
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const submission = await prisma.contactSubmission.findUnique({
      where: { id },
      include: {
        comments: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(submission);
  } catch (error) {
    logger.error("Error fetching contact submission", error);
    return NextResponse.json(
      { error: "Failed to fetch contact submission" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/contact/[id] - Update a contact submission
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true, name: true },
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    // Validate status
    const validStatuses: ContactStatus[] = ["NEW", "IN_PROGRESS", "RESOLVED", "SPAM"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const submission = await prisma.contactSubmission.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(status === "RESOLVED" || status === "SPAM"
          ? {
              handledBy: user.name || session.user.id,
              handledAt: new Date(),
            }
          : {}),
      },
      include: {
        comments: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return NextResponse.json(submission);
  } catch (error) {
    logger.error("Error updating contact submission", error);
    return NextResponse.json(
      { error: "Failed to update contact submission" },
      { status: 500 }
    );
  }
}
