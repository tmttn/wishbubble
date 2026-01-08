import { NextResponse } from "next/server";
import { processEmailQueue, cleanupOldEmails } from "@/lib/email/queue";
import { createDirectPrismaClient } from "@/lib/db";
import { logger } from "@/lib/logger";
import * as Sentry from "@sentry/nextjs";

// Process the email queue every 2 minutes
// Schedule: */2 * * * *

export async function GET(request: Request) {
  const checkInId = Sentry.captureCheckIn(
    {
      monitorSlug: "email-queue",
      status: "in_progress",
    },
    {
      schedule: { type: "crontab", value: "*/2 * * * *" },
      maxRuntime: 3, // 3 minutes max (150 emails * 600ms = 90s + overhead)
      timezone: "Etc/UTC",
    }
  );

  // Create a direct database connection to bypass Prisma Accelerate
  // This avoids transient "Query Engine communication" errors that can occur
  // with Accelerate's proxy layer in serverless environments
  const directDb = createDirectPrismaClient();

  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      logger.warn("Unauthorized cron access attempt", { cron: "email-queue" });
      Sentry.captureCheckIn({
        checkInId,
        monitorSlug: "email-queue",
        status: "error",
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Process pending emails using the direct connection
    const result = await processEmailQueue(150, directDb);

    // Cleanup old completed emails once per run
    const cleaned = await cleanupOldEmails();

    logger.info("Email queue cron completed", {
      ...result,
      cleanedUp: cleaned,
    });

    Sentry.captureCheckIn({
      checkInId,
      monitorSlug: "email-queue",
      status: "ok",
    });

    // Flush Sentry events before serverless function terminates
    await Sentry.flush(2000);

    return NextResponse.json({
      success: true,
      ...result,
      cleanedUp: cleaned,
    });
  } catch (error) {
    logger.error("Error processing email queue", error);

    Sentry.captureCheckIn({
      checkInId,
      monitorSlug: "email-queue",
      status: "error",
    });

    // Flush Sentry events before serverless function terminates
    await Sentry.flush(2000);

    return NextResponse.json(
      { error: "Failed to process email queue" },
      { status: 500 }
    );
  } finally {
    // Disconnect the direct database connection to clean up resources
    await directDb.$disconnect();
  }
}
