import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

// PATCH /api/user/locale - Update user's locale preference
export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { locale } = body;

    // Validate locale
    const validLocales = ["en", "nl"];
    if (!validLocales.includes(locale)) {
      return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { locale },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error updating locale", error);
    return NextResponse.json(
      { error: "Failed to update locale" },
      { status: 500 }
    );
  }
}
