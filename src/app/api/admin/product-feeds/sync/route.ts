import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { prisma, createDirectPrismaClient } from "@/lib/db";
import { logger } from "@/lib/logger";
import {
  parseAwinCsv,
  mapAvailability,
  buildSearchText,
  reloadFeedProviders,
} from "@/lib/product-search";

/**
 * Remove null bytes (0x00) from strings to prevent PostgreSQL encoding errors
 */
function sanitizeForPostgres(value: unknown): unknown {
  if (typeof value === "string") {
    // Remove null bytes which PostgreSQL rejects
    return value.replace(/\x00/g, "");
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeForPostgres);
  }
  if (value !== null && typeof value === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      sanitized[key] = sanitizeForPostgres(val);
    }
    return sanitized;
  }
  return value;
}

// Extend timeout to 60 seconds for large feed downloads
export const maxDuration = 60;

// Retry wrapper for Prisma operations (handles Accelerate connection issues)
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delayMs = 500
): Promise<T> {
  let lastError: Error | undefined;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxRetries) {
        logger.warn(`Prisma operation failed, retrying (${attempt}/${maxRetries})`, {
          error: lastError.message,
        });
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
      }
    }
  }
  throw lastError;
}

/**
 * GET /api/admin/product-feeds/sync?providerId=xxx
 *
 * Get the current sync progress for a provider
 */
export async function GET(request: NextRequest) {
  try {
    const adminResult = await requireAdminApi();
    if (adminResult.error) {
      return NextResponse.json(
        { error: adminResult.error },
        { status: adminResult.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get("providerId");

    if (!providerId) {
      return NextResponse.json(
        { error: "Provider ID is required" },
        { status: 400 }
      );
    }

    // Get the most recent import log for this provider
    const importLog = await prisma.feedImportLog.findFirst({
      where: { providerId },
      orderBy: { startedAt: "desc" },
    });

    if (!importLog) {
      return NextResponse.json({ status: "idle" });
    }

    const progress =
      importLog.recordsTotal && importLog.recordsTotal > 0
        ? Math.round(
            ((importLog.recordsImported + importLog.recordsFailed) /
              importLog.recordsTotal) *
              100
          )
        : 0;

    return NextResponse.json({
      status: importLog.status.toLowerCase(),
      progress,
      recordsTotal: importLog.recordsTotal,
      recordsImported: importLog.recordsImported,
      recordsFailed: importLog.recordsFailed,
      startedAt: importLog.startedAt,
      completedAt: importLog.completedAt,
      errorMessage: importLog.errorMessage,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("Sync progress error", error, { errorMessage });
    return NextResponse.json(
      { error: "Failed to get sync progress" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/product-feeds/sync
 *
 * Sync products from a feed URL (fetches the CSV from the URL)
 *
 * Body: { providerId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const adminResult = await requireAdminApi();
    if (adminResult.error) {
      return NextResponse.json(
        { error: adminResult.error },
        { status: adminResult.status }
      );
    }

    const body = await request.json();
    const { providerId } = body;

    if (!providerId) {
      return NextResponse.json(
        { error: "Provider ID is required" },
        { status: 400 }
      );
    }

    // Verify provider exists and is a feed type with a URL configured
    const provider = await prisma.productProvider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      return NextResponse.json(
        { error: "Provider not found" },
        { status: 404 }
      );
    }

    if (provider.type !== "FEED") {
      return NextResponse.json(
        { error: "Provider is not a feed type. Only FEED providers support sync." },
        { status: 400 }
      );
    }

    if (!provider.feedUrl) {
      return NextResponse.json(
        { error: "Provider has no feed URL configured. Please add a feed URL first." },
        { status: 400 }
      );
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
        importedBy: adminResult.session!.user.id,
      },
    });

    logger.info("Starting feed sync from URL", {
      providerId: provider.providerId,
      feedUrl: provider.feedUrl,
      importLogId: importLog.id,
    });

    // Fetch CSV from URL
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

      csvText = await response.text();
      fileSize = Buffer.byteLength(csvText, "utf-8");

      logger.info("Feed downloaded successfully", {
        providerId: provider.providerId,
        fileSize,
      });
    } catch (fetchError) {
      const errorMessage =
        fetchError instanceof Error ? fetchError.message : "Failed to fetch feed URL";

      // Create direct Prisma client for error handling (bypasses Accelerate)
      const freshPrisma = createDirectPrismaClient();
      try {
        await freshPrisma.feedImportLog.update({
          where: { id: importLog.id },
          data: {
            status: "FAILED",
            errorMessage: `Failed to download feed: ${errorMessage}`,
            completedAt: new Date(),
          },
        });

        await freshPrisma.productProvider.update({
          where: { id: provider.id },
          data: {
            syncStatus: "FAILED",
            syncError: errorMessage,
          },
        });
      } finally {
        await freshPrisma.$disconnect();
      }

      logger.error("Feed sync fetch failed", fetchError, {
        providerId: provider.providerId,
        feedUrl: provider.feedUrl,
      });

      return NextResponse.json(
        { error: "Failed to download feed", details: errorMessage },
        { status: 502 }
      );
    }

    // Create direct Prisma client after download (bypasses Accelerate which has issues with long-running ops)
    const db = createDirectPrismaClient();

    try {
      // Update file size in import log
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

        logger.error("Feed sync CSV parsing failed", parseError, {
          providerId: provider.providerId,
        });

        return NextResponse.json(
          { error: "Failed to parse CSV", details: errorMessage },
          { status: 400 }
        );
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

        return NextResponse.json(
          {
            error: "No valid products found in feed",
            parseErrors: parseErrors.slice(0, 10),
          },
          { status: 400 }
        );
      }

      // Update import log with total records count
      await db.feedImportLog.update({
        where: { id: importLog.id },
        data: { recordsTotal: products.length },
      });

      // Batch upsert products
      let imported = 0;
      let failed = 0;
      const batchSize = 100;

      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);

        try {
          await db.$transaction(
            batch.map((product) =>
              db.feedProduct.upsert({
                where: {
                  providerId_externalId: {
                    providerId: provider.id,
                    externalId: product.id,
                  },
                },
                create: {
                  providerId: provider.id,
                  externalId: String(sanitizeForPostgres(product.id)),
                  ean: product.ean ? String(sanitizeForPostgres(product.ean)) : null,
                  title: String(sanitizeForPostgres(product.title)),
                  description: product.description ? String(sanitizeForPostgres(product.description)) : null,
                  brand: product.brand ? String(sanitizeForPostgres(product.brand)) : null,
                  category: product.category ? String(sanitizeForPostgres(product.category)) : null,
                  price: product.price,
                  currency: product.currency || "EUR",
                  originalPrice: product.originalPrice || null,
                  url: String(sanitizeForPostgres(product.url)),
                  affiliateUrl: product.affiliateUrl ? String(sanitizeForPostgres(product.affiliateUrl)) : null,
                  imageUrl: product.imageUrl ? String(sanitizeForPostgres(product.imageUrl)) : null,
                  availability: mapAvailability(product.availability),
                  searchText: String(sanitizeForPostgres(buildSearchText(product))),
                  rawData: sanitizeForPostgres(product) as object,
                },
                update: {
                  ean: product.ean ? String(sanitizeForPostgres(product.ean)) : null,
                  title: String(sanitizeForPostgres(product.title)),
                  description: product.description ? String(sanitizeForPostgres(product.description)) : null,
                  brand: product.brand ? String(sanitizeForPostgres(product.brand)) : null,
                  category: product.category ? String(sanitizeForPostgres(product.category)) : null,
                  price: product.price,
                  currency: product.currency || "EUR",
                  originalPrice: product.originalPrice || null,
                  url: String(sanitizeForPostgres(product.url)),
                  affiliateUrl: product.affiliateUrl ? String(sanitizeForPostgres(product.affiliateUrl)) : null,
                  imageUrl: product.imageUrl ? String(sanitizeForPostgres(product.imageUrl)) : null,
                  availability: mapAvailability(product.availability),
                  searchText: String(sanitizeForPostgres(buildSearchText(product))),
                  rawData: sanitizeForPostgres(product) as object,
                  updatedAt: new Date(),
                },
              })
            )
          );
          imported += batch.length;
        } catch (batchError) {
          logger.error("Batch sync error", batchError, {
            providerId: provider.providerId,
            batchIndex: i,
            batchSize: batch.length,
          });
          failed += batch.length;
        }

        // Update progress in import log after each batch
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

      // Reload feed providers to pick up the new products
      await reloadFeedProviders();

      logger.info("Feed sync completed", {
        providerId: provider.providerId,
        imported,
        failed,
        total: products.length,
        productCount,
      });

      return NextResponse.json({
        success: true,
        importLogId: importLog.id,
        imported,
        failed,
        total: products.length,
        productCount,
        parseErrors: parseErrors.slice(0, 10),
      });
    } finally {
      await db.$disconnect();
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("Feed sync error", error, { errorMessage });
    return NextResponse.json(
      { error: "Failed to sync feed", details: errorMessage },
      { status: 500 }
    );
  }
}
