import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { sendOwnerDigestEmail } from "@/lib/email";
import { getOwnerDigestData } from "@/lib/admin/get-owner-digest-data";
import { logger } from "@/lib/logger";

export async function POST() {
  try {
    const adminCheck = await requireAdminApi();

    if (adminCheck.error) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const session = adminCheck.session!;

    const ownerEmail = process.env.OWNER_EMAIL;
    if (!ownerEmail) {
      return NextResponse.json(
        { error: "OWNER_EMAIL not configured" },
        { status: 400 }
      );
    }

    // Generate test digest data (daily period)
    const digestData = await getOwnerDigestData("daily");

    // Send the test email
    const result = await sendOwnerDigestEmail({
      to: ownerEmail,
      data: digestData,
    });

    if (!result.success) {
      logger.error("Failed to send test digest email", result.error, {
        ownerEmail,
        sentBy: session.user.id,
      });
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    logger.info("Test owner digest sent", {
      ownerEmail,
      sentBy: session.user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Failed to send test owner digest", error);
    return NextResponse.json(
      { error: "Failed to send test digest" },
      { status: 500 }
    );
  }
}
