import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ContactStatus } from "@prisma/client";
import { logger } from "@/lib/logger";
import { requireAdminApi } from "@/lib/admin";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/admin/contact/[id] - Get a specific contact submission
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const authResult = await requireAdminApi();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
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
    const authResult = await requireAdminApi();
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { session } = authResult;

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
              handledBy: session?.user?.name || session?.user?.id || "Admin",
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
