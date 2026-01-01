import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isUserAdmin } from "@/lib/admin";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ isAdmin: false });
    }

    const admin = await isUserAdmin(session.user.id);

    return NextResponse.json({ isAdmin: admin });
  } catch (error) {
    logger.error("Admin check error", error);
    return NextResponse.json({ isAdmin: false });
  }
}
