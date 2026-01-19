import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { isTypesenseEnabled, fullResync } from "@/lib/typesense";
import * as Sentry from "@sentry/nextjs";

// Extend timeout to 300 seconds (5 minutes) for large resync
export const maxDuration = 300;

/**
 * GET /api/cron/typesense-resync
 *
 * Daily cron job to perform a full resync of all products to Typesense.
 * This is a safety net to ensure search index stays in sync with database.
 *
 * Recommended schedule: Daily at 4 AM (after feed-sync at 6 AM)
 */
export async function GET(request: Request) {
  const checkInId = Sentry.captureCheckIn(
    {
      monitorSlug: "typesense-resync",
      status: "in_progress",
    },
    {
      schedule: { type: "crontab", value: "0 4 * * *" },
      maxRuntime: 6, // 6 minutes
      timezone: "Etc/UTC",
    }
  );

  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      logger.warn("Unauthorized cron access attempt", { cron: "typesense-resync" });
      Sentry.captureCheckIn({
        checkInId,
        monitorSlug: "typesense-resync",
        status: "error",
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if Typesense is enabled
    if (!isTypesenseEnabled()) {
      logger.info("Typesense is not enabled, skipping resync");
      Sentry.captureCheckIn({
        checkInId,
        monitorSlug: "typesense-resync",
        status: "ok",
      });
      return NextResponse.json({
        success: true,
        message: "Typesense is not enabled",
        skipped: true,
      });
    }

    // Run full resync
    logger.info("Starting Typesense full resync");
    const result = await fullResync();

    const status = result.failed === 0 ? "ok" : "error";
    Sentry.captureCheckIn({
      checkInId,
      monitorSlug: "typesense-resync",
      status,
    });

    await Sentry.flush(2000);

    logger.info("Typesense resync completed", result);

    return NextResponse.json({
      success: true,
      ...result,
      durationSeconds: (result.duration / 1000).toFixed(1),
    });
  } catch (error) {
    logger.error("Typesense resync cron error", error);

    Sentry.captureCheckIn({
      checkInId,
      monitorSlug: "typesense-resync",
      status: "error",
    });

    await Sentry.flush(2000);

    return NextResponse.json(
      { error: "Failed to run Typesense resync" },
      { status: 500 }
    );
  }
}
