import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { z } from "zod";

const updateBetaSchema = z.object({
  isBetaTester: z.boolean(),
});

// GET /api/user/beta - Get beta tester status
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        isBetaTester: true,
        betaOptInAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    logger.error("Error fetching beta status", error);
    return NextResponse.json(
      { error: "Failed to fetch beta status" },
      { status: 500 }
    );
  }
}

// PATCH /api/user/beta - Toggle beta tester status
export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = updateBetaSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0].message },
        { status: 400 }
      );
    }

    const { isBetaTester } = validated.data;

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        isBetaTester,
        betaOptInAt: isBetaTester ? new Date() : null,
      },
      select: {
        isBetaTester: true,
        betaOptInAt: true,
      },
    });

    logger.info("Beta tester status updated", {
      userId: session.user.id,
      isBetaTester,
    });

    return NextResponse.json(user);
  } catch (error) {
    logger.error("Error updating beta status", error);
    return NextResponse.json(
      { error: "Failed to update beta status" },
      { status: 500 }
    );
  }
}
