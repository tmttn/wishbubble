import { NextResponse } from "next/server";
import { gunzipSync } from "zlib";
import { createId } from "@paralleldrive/cuid2";
import { prisma, createDirectPrismaClient } from "@/lib/db";
import { logger } from "@/lib/logger";
import {
  parseAwinCsv,
  mapAvailability,
  buildSearchText,
  reloadFeedProviders,
} from "@/lib/product-search";
import * as Sentry from "@sentry/nextjs";

// Extend timeout to 300 seconds (5 minutes) for large feed syncs
export const maxDuration = 300;

// Awin feed list URL for checking update dates
const AWIN_FEED_LIST_URL = process.env.AWIN_FEED_LIST_URL;

interface AwinFeedInfo {
  feedId: string;
  url: string;
  lastImported: Date | null;
}

/**
 * GET /api/cron/feed-sync
 *
 * Cron job to sync all enabled feed providers that have been updated.
 * This checks the Awin feed list for update dates and only syncs feeds
 * that have been updated since the last sync.
 */
export async function GET(request: Request) {
  const checkInId = Sentry.captureCheckIn(
    {
      monitorSlug: "feed-sync",
      status: "in_progress",
    },
    {
      schedule: { type: "crontab", value: "0 6 * * *" },
      maxRuntime: 6, // 6 minutes (slightly above Vercel's 5 min limit)
      timezone: "Etc/UTC",
    }
  );

  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      logger.warn("Unauthorized cron access attempt", { cron: "feed-sync" });
      Sentry.captureCheckIn({
        checkInId,
        monitorSlug: "feed-sync",
        status: "error",
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all enabled feed providers with feed URLs
    const providers = await prisma.productProvider.findMany({
      where: {
        type: "FEED",
        enabled: true,
        feedUrl: { not: null },
      },
    });

    if (providers.length === 0) {
      logger.info("No enabled feed providers found for sync");
      Sentry.captureCheckIn({
        checkInId,
        monitorSlug: "feed-sync",
        status: "ok",
      });
      return NextResponse.json({
        success: true,
        message: "No enabled feed providers",
        synced: 0,
      });
    }

    // Fetch Awin feed list to get update dates
    const awinFeedInfo = await fetchAwinFeedInfo();

    const results: Array<{
      providerId: string;
      name: string;
      status: "synced" | "skipped" | "failed";
      reason?: string;
      imported?: number;
      failed?: number;
    }> = [];

    for (const provider of providers) {
      try {
        // Find the Awin feed info for this provider
        const feedInfo = awinFeedInfo.find((f) =>
          provider.feedUrl?.includes(f.url) ||
          provider.feedUrl?.includes(`feedId=${f.feedId}`) ||
          provider.feedUrl === f.url
        );

        // Check if sync is needed based on update date
        if (feedInfo?.lastImported && provider.lastSynced) {
          const lastImported = new Date(feedInfo.lastImported);
          const lastSynced = new Date(provider.lastSynced);

          if (lastImported <= lastSynced) {
            logger.info("Skipping feed sync - no updates", {
              providerId: provider.providerId,
              lastImported: lastImported.toISOString(),
              lastSynced: lastSynced.toISOString(),
            });
            results.push({
              providerId: provider.providerId,
              name: provider.name,
              status: "skipped",
              reason: "No updates since last sync",
            });
            continue;
          }
        }

        // Sync this provider
        logger.info("Starting feed sync", {
          providerId: provider.providerId,
          feedUrl: provider.feedUrl,
        });

        const syncResult = await syncProvider(provider);
        results.push({
          providerId: provider.providerId,
          name: provider.name,
          status: syncResult.success ? "synced" : "failed",
          reason: syncResult.error,
          imported: syncResult.imported,
          failed: syncResult.failed,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        logger.error("Feed sync failed for provider", error, {
          providerId: provider.providerId,
        });
        results.push({
          providerId: provider.providerId,
          name: provider.name,
          status: "failed",
          reason: errorMessage,
        });
      }
    }

    const syncedCount = results.filter((r) => r.status === "synced").length;
    const failedCount = results.filter((r) => r.status === "failed").length;

    logger.info("Feed sync cron completed", {
      total: providers.length,
      synced: syncedCount,
      skipped: results.filter((r) => r.status === "skipped").length,
      failed: failedCount,
    });

    Sentry.captureCheckIn({
      checkInId,
      monitorSlug: "feed-sync",
      status: failedCount === providers.length ? "error" : "ok",
    });

    await Sentry.flush(2000);

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: providers.length,
        synced: syncedCount,
        skipped: results.filter((r) => r.status === "skipped").length,
        failed: failedCount,
      },
    });
  } catch (error) {
    logger.error("Feed sync cron error", error);

    Sentry.captureCheckIn({
      checkInId,
      monitorSlug: "feed-sync",
      status: "error",
    });

    await Sentry.flush(2000);

    return NextResponse.json(
      { error: "Failed to run feed sync" },
      { status: 500 }
    );
  }
}

/**
 * Fetches the Awin feed list and extracts feed URLs with their last import dates
 */
async function fetchAwinFeedInfo(): Promise<AwinFeedInfo[]> {
  if (!AWIN_FEED_LIST_URL) {
    logger.warn("AWIN_FEED_LIST_URL not configured, skipping update date check");
    return [];
  }

  try {
    const response = await fetch(AWIN_FEED_LIST_URL, {
      headers: {
        "User-Agent": "WishBubble/1.0 Feed Sync",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const csvText = await response.text();
    const lines = csvText.split("\n");

    if (lines.length < 2) return [];

    // Parse header to get column indices
    const header = parseCSVLine(lines[0]);
    const columnMap: Record<string, number> = {};
    header.forEach((col, index) => {
      columnMap[col.toLowerCase().trim()] = index;
    });

    const feeds: AwinFeedInfo[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const values = parseCSVLine(line);

        const feedId =
          getColumnValue(values, columnMap, ["feed id", "feedid"]) || "";
        const url = getColumnValue(values, columnMap, ["url"]) || "";
        const lastImportedStr =
          getColumnValue(values, columnMap, ["last imported", "lastimported"]) ||
          "";

        if (feedId && url) {
          let lastImported: Date | null = null;
          if (lastImportedStr) {
            // Parse date - Awin uses format like "2024-01-15 10:30:00"
            const parsed = new Date(lastImportedStr.replace(" ", "T") + "Z");
            if (!isNaN(parsed.getTime())) {
              lastImported = parsed;
            }
          }

          feeds.push({ feedId, url, lastImported });
        }
      } catch {
        // Skip malformed lines
        continue;
      }
    }

    return feeds;
  } catch (error) {
    logger.error("Failed to fetch Awin feed list", error);
    return [];
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function getColumnValue(
  values: string[],
  columnMap: Record<string, number>,
  possibleNames: string[]
): string | undefined {
  for (const name of possibleNames) {
    const index = columnMap[name];
    if (index !== undefined && values[index] !== undefined) {
      return values[index];
    }
  }
  return undefined;
}

interface SyncResult {
  success: boolean;
  imported?: number;
  failed?: number;
  error?: string;
}

/**
 * Syncs a single provider from its feed URL
 */
async function syncProvider(provider: {
  id: string;
  providerId: string;
  feedUrl: string | null;
}): Promise<SyncResult> {
  if (!provider.feedUrl) {
    return { success: false, error: "No feed URL configured" };
  }

  // Update provider status to syncing
  await prisma.productProvider.update({
    where: { id: provider.id },
    data: { syncStatus: "SYNCING" },
  });

  // Create import log
  const importLog = await prisma.feedImportLog.create({
    data: {
      providerId: provider.id,
      fileName: provider.feedUrl,
      status: "PROCESSING",
      importedBy: "system-cron",
    },
  });

  let csvText: string;
  let fileSize: number;

  try {
    const response = await fetch(provider.feedUrl, {
      headers: {
        "User-Agent": "WishBubble/1.0 Feed Sync",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Check if response is gzip compressed
    const contentType = response.headers.get("content-type") || "";
    const contentEncoding = response.headers.get("content-encoding") || "";
    const isGzip =
      contentEncoding.includes("gzip") ||
      contentType.includes("gzip") ||
      provider.feedUrl.includes("compression/gzip");

    if (isGzip && !contentEncoding.includes("gzip")) {
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      csvText = gunzipSync(buffer).toString("utf-8");
    } else {
      csvText = await response.text();
    }

    fileSize = Buffer.byteLength(csvText, "utf-8");
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch feed URL";

    await prisma.feedImportLog.update({
      where: { id: importLog.id },
      data: {
        status: "FAILED",
        errorMessage: `Failed to download feed: ${errorMessage}`,
        completedAt: new Date(),
      },
    });

    await prisma.productProvider.update({
      where: { id: provider.id },
      data: {
        syncStatus: "FAILED",
        syncError: errorMessage,
      },
    });

    return { success: false, error: errorMessage };
  }

  // Create direct Prisma client for bulk operations
  const db = createDirectPrismaClient();

  try {
    await db.feedImportLog.update({
      where: { id: importLog.id },
      data: { fileSize },
    });

    // Parse CSV
    let parseResult;
    try {
      parseResult = await parseAwinCsv(csvText);
    } catch (parseError) {
      const errorMessage =
        parseError instanceof Error ? parseError.message : "CSV parsing failed";

      await db.feedImportLog.update({
        where: { id: importLog.id },
        data: {
          status: "FAILED",
          errorMessage,
          completedAt: new Date(),
        },
      });

      await db.productProvider.update({
        where: { id: provider.id },
        data: {
          syncStatus: "FAILED",
          syncError: errorMessage,
        },
      });

      return { success: false, error: errorMessage };
    }

    const { products, errors: parseErrors } = parseResult;

    if (products.length === 0) {
      await db.feedImportLog.update({
        where: { id: importLog.id },
        data: {
          status: "FAILED",
          errorMessage: "No valid products found in feed",
          recordsTotal: parseResult.totalRows,
          recordsFailed: parseResult.totalRows,
          completedAt: new Date(),
        },
      });

      await db.productProvider.update({
        where: { id: provider.id },
        data: {
          syncStatus: "FAILED",
          syncError: "No valid products found in feed",
        },
      });

      return { success: false, error: "No valid products found" };
    }

    // Update import log with total records count
    await db.feedImportLog.update({
      where: { id: importLog.id },
      data: { recordsTotal: products.length },
    });

    // Bulk upsert products
    let imported = 0;
    let failed = 0;
    const batchSize = 500;

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);

      try {
        const values = batch
          .map((product) => {
            const availability = mapAvailability(product.availability);
            const searchText = buildSearchText(product);
            const id = createId();
            return `(
              '${id}',
              ${provider.id ? `'${provider.id}'` : "NULL"},
              '${product.id.replace(/'/g, "''")}',
              ${product.ean ? `'${product.ean.replace(/'/g, "''")}'` : "NULL"},
              '${product.title.replace(/'/g, "''")}',
              ${product.description ? `'${product.description.replace(/'/g, "''")}'` : "NULL"},
              ${product.brand ? `'${product.brand.replace(/'/g, "''")}'` : "NULL"},
              ${product.category ? `'${product.category.replace(/'/g, "''")}'` : "NULL"},
              ${product.price},
              '${product.currency || "EUR"}',
              ${product.originalPrice || "NULL"},
              '${product.url.replace(/'/g, "''")}',
              ${product.affiliateUrl ? `'${product.affiliateUrl.replace(/'/g, "''")}'` : "NULL"},
              ${product.imageUrl ? `'${product.imageUrl.replace(/'/g, "''")}'` : "NULL"},
              '${availability}'::"ProductAvailability",
              '${searchText.replace(/'/g, "''")}',
              '${JSON.stringify(product).replace(/'/g, "''")}'::jsonb,
              NOW(),
              NOW()
            )`;
          })
          .join(",\n");

        await db.$executeRawUnsafe(`
          INSERT INTO "FeedProduct" (
            "id", "providerId", "externalId", "ean", "title", "description",
            "brand", "category", "price", "currency", "originalPrice",
            "url", "affiliateUrl", "imageUrl", "availability", "searchText",
            "rawData", "createdAt", "updatedAt"
          ) VALUES ${values}
          ON CONFLICT ("providerId", "externalId") DO UPDATE SET
            "ean" = EXCLUDED."ean",
            "title" = EXCLUDED."title",
            "description" = EXCLUDED."description",
            "brand" = EXCLUDED."brand",
            "category" = EXCLUDED."category",
            "price" = EXCLUDED."price",
            "currency" = EXCLUDED."currency",
            "originalPrice" = EXCLUDED."originalPrice",
            "url" = EXCLUDED."url",
            "affiliateUrl" = EXCLUDED."affiliateUrl",
            "imageUrl" = EXCLUDED."imageUrl",
            "availability" = EXCLUDED."availability",
            "searchText" = EXCLUDED."searchText",
            "rawData" = EXCLUDED."rawData",
            "updatedAt" = NOW()
        `);

        imported += batch.length;
      } catch (batchError) {
        logger.error("Batch upsert error in cron", batchError, {
          providerId: provider.providerId,
          batchIndex: i,
        });
        failed += batch.length;
      }

      // Update progress
      await db.feedImportLog.update({
        where: { id: importLog.id },
        data: {
          recordsImported: imported,
          recordsFailed: failed,
        },
      });
    }

    // Update import log
    const finalStatus = failed === products.length ? "FAILED" : "COMPLETED";
    await db.feedImportLog.update({
      where: { id: importLog.id },
      data: {
        status: finalStatus,
        recordsTotal: parseResult.totalRows,
        recordsImported: imported,
        recordsFailed: failed + parseErrors.length,
        errorMessage:
          parseErrors.length > 0
            ? `${parseErrors.length} rows had parsing errors`
            : null,
        completedAt: new Date(),
      },
    });

    // Update provider stats
    const productCount = await db.feedProduct.count({
      where: { providerId: provider.id },
    });

    await db.productProvider.update({
      where: { id: provider.id },
      data: {
        lastSynced: new Date(),
        syncStatus: finalStatus === "COMPLETED" ? "SUCCESS" : "FAILED",
        syncError: null,
        productCount,
      },
    });

    // Reload feed providers
    await reloadFeedProviders();

    logger.info("Feed sync completed in cron", {
      providerId: provider.providerId,
      imported,
      failed,
      total: products.length,
    });

    return {
      success: true,
      imported,
      failed,
    };
  } finally {
    await db.$disconnect();
  }
}
