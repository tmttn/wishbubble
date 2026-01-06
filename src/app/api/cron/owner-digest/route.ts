import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendOwnerDigestEmail } from "@/lib/email";
import { getOwnerDigestData } from "@/lib/admin/get-owner-digest-data";
import { logger } from "@/lib/logger";
import * as Sentry from "@sentry/nextjs";

// This endpoint should be called by a cron job (e.g., Vercel Cron)
// It sends daily/weekly digest emails to the app owner
// Recommended cron schedule: "0 * * * *" (every hour to check if it's time to send)

export async function GET(request: Request) {
  const checkInId = Sentry.captureCheckIn(
    {
      monitorSlug: "owner-digest",
      status: "in_progress",
    },
    {
      schedule: { type: "crontab", value: "0 * * * *" },
      maxRuntime: 2,
      timezone: "Etc/UTC",
    }
  );

  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      logger.warn("Unauthorized cron access attempt", { cron: "owner-digest" });
      Sentry.captureCheckIn({
        checkInId,
        monitorSlug: "owner-digest",
        status: "error",
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get owner email from environment
    const ownerEmail = process.env.OWNER_EMAIL;
    if (!ownerEmail) {
      logger.info("Owner digest skipped - OWNER_EMAIL not configured");
      Sentry.captureCheckIn({
        checkInId,
        monitorSlug: "owner-digest",
        status: "ok",
      });
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: "OWNER_EMAIL not configured",
      });
    }

    // Get or create digest settings
    let settings = await prisma.ownerDigestSettings.findFirst();
    if (!settings) {
      // Create default settings
      settings = await prisma.ownerDigestSettings.create({
        data: {
          id: "singleton",
          frequency: "DAILY",
          deliveryHour: 8,
          weeklyDay: 1, // Monday
        },
      });
    }

    // Check if digest is disabled
    if (settings.frequency === "OFF") {
      logger.info("Owner digest skipped - frequency set to OFF");
      Sentry.captureCheckIn({
        checkInId,
        monitorSlug: "owner-digest",
        status: "ok",
      });
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: "Digest disabled",
      });
    }

    const now = new Date();
    const currentHour = now.getUTCHours();
    const currentDay = now.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.

    // Check if it's the right hour to send
    if (currentHour !== settings.deliveryHour) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: `Not delivery hour (current: ${currentHour}, configured: ${settings.deliveryHour})`,
      });
    }

    // For weekly digest, check if it's the right day
    if (settings.frequency === "WEEKLY" && currentDay !== settings.weeklyDay) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: `Not weekly delivery day (current: ${currentDay}, configured: ${settings.weeklyDay})`,
      });
    }

    // Check if we've already sent today (prevent duplicate sends)
    if (settings.lastSentAt) {
      const lastSentDate = new Date(settings.lastSentAt);
      const isSameDay =
        lastSentDate.getUTCFullYear() === now.getUTCFullYear() &&
        lastSentDate.getUTCMonth() === now.getUTCMonth() &&
        lastSentDate.getUTCDate() === now.getUTCDate();

      if (isSameDay) {
        return NextResponse.json({
          success: true,
          skipped: true,
          reason: "Already sent today",
        });
      }
    }

    // Collect digest data
    const period = settings.frequency === "DAILY" ? "daily" : "weekly";
    const digestData = await getOwnerDigestData(period);

    // Skip if there's no activity and health is good (optional: always send)
    // Uncomment below to skip empty digests:
    // if (!digestData.hasActivity) {
    //   return NextResponse.json({
    //     success: true,
    //     skipped: true,
    //     reason: "No activity to report",
    //   });
    // }

    // Send the digest email
    const result = await sendOwnerDigestEmail({
      to: ownerEmail,
      data: digestData,
    });

    if (!result.success) {
      logger.error("Failed to send owner digest email", result.error, {
        ownerEmail,
        period,
      });
      Sentry.captureCheckIn({
        checkInId,
        monitorSlug: "owner-digest",
        status: "error",
      });

      await Sentry.flush(2000);

      return NextResponse.json(
        { error: "Failed to send owner digest email" },
        { status: 500 }
      );
    }

    // Update last sent timestamp
    await prisma.ownerDigestSettings.update({
      where: { id: settings.id },
      data: { lastSentAt: now },
    });

    logger.info("Owner digest sent successfully", {
      ownerEmail,
      period,
      hasActivity: digestData.hasActivity,
      highlightsCount: digestData.highlights.length,
    });

    Sentry.captureCheckIn({
      checkInId,
      monitorSlug: "owner-digest",
      status: "ok",
    });

    await Sentry.flush(2000);

    return NextResponse.json({
      success: true,
      sent: true,
      period,
      hasActivity: digestData.hasActivity,
    });
  } catch (error) {
    logger.error("Error processing owner digest", error);

    Sentry.captureCheckIn({
      checkInId,
      monitorSlug: "owner-digest",
      status: "error",
    });

    await Sentry.flush(2000);

    return NextResponse.json(
      { error: "Failed to process owner digest" },
      { status: 500 }
    );
  }
}
