import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin";
import { logger } from "@/lib/logger";

export async function PUT(request: Request) {
  try {
    const adminCheck = await requireAdminApi();

    if (adminCheck.error) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const session = adminCheck.session!;

    const body = await request.json();
    const { frequency, deliveryHour, weeklyDay } = body;

    // Validate frequency
    if (!["OFF", "DAILY", "WEEKLY"].includes(frequency)) {
      return NextResponse.json(
        { error: "Invalid frequency" },
        { status: 400 }
      );
    }

    // Validate deliveryHour
    if (typeof deliveryHour !== "number" || deliveryHour < 0 || deliveryHour > 23) {
      return NextResponse.json(
        { error: "Invalid delivery hour" },
        { status: 400 }
      );
    }

    // Validate weeklyDay
    if (typeof weeklyDay !== "number" || weeklyDay < 0 || weeklyDay > 6) {
      return NextResponse.json(
        { error: "Invalid weekly day" },
        { status: 400 }
      );
    }

    // Update or create settings
    const settings = await prisma.ownerDigestSettings.upsert({
      where: { id: "singleton" },
      update: {
        frequency,
        deliveryHour,
        weeklyDay,
      },
      create: {
        id: "singleton",
        frequency,
        deliveryHour,
        weeklyDay,
      },
    });

    logger.info("Owner digest settings updated", {
      frequency,
      deliveryHour,
      weeklyDay,
      updatedBy: session.user.id,
    });

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    logger.error("Failed to update owner digest settings", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
