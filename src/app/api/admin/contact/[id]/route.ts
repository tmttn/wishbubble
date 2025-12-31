import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ContactStatus } from "@prisma/client";

// GET /api/admin/contact/[id] - Get a specific contact submission
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    const { id } = await context.params;

    const submission = await prisma.contactSubmission.findUnique({
      where: { id },
    });

    if (!submission) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(submission);
  } catch (error) {
    console.error("Error fetching contact submission:", error);
    return NextResponse.json(
      { error: "Failed to fetch contact submission" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/contact/[id] - Update a contact submission
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    const { id } = await context.params;
    const body = await request.json();
    const { status, notes } = body;

    // Validate status
    const validStatuses: ContactStatus[] = ["NEW", "IN_PROGRESS", "RESOLVED", "SPAM"];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const submission = await prisma.contactSubmission.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes }),
        ...(status === "RESOLVED" || status === "SPAM"
          ? {
              handledBy: user.name || session.user.id,
              handledAt: new Date(),
            }
          : {}),
      },
    });

    return NextResponse.json(submission);
  } catch (error) {
    console.error("Error updating contact submission:", error);
    return NextResponse.json(
      { error: "Failed to update contact submission" },
      { status: 500 }
    );
  }
}
