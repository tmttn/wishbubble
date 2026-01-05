import { NextRequest, NextResponse } from "next/server";
import { gunzipSync } from "zlib";
import { requireAdminApi } from "@/lib/admin";
import { prisma, createDirectPrismaClient } from "@/lib/db";
import { logger } from "@/lib/logger";
import {
  parseAwinCsv,
  mapAvailability,
  buildSearchText,
  reloadFeedProviders,
} from "@/lib/product-search";

// Extend timeout to 60 seconds for large feed downloads
export const maxDuration = 60;

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

      // Check if response is gzip compressed (Awin feeds use gzip)
      const contentType = response.headers.get("content-type") || "";
      const contentEncoding = response.headers.get("content-encoding") || "";
      const isGzip =
        contentEncoding.includes("gzip") ||
        contentType.includes("gzip") ||
        provider.feedUrl.includes("compression/gzip");

      if (isGzip && !contentEncoding.includes("gzip")) {
        // Server returned gzip content but didn't set content-encoding header
        // (fetch won't auto-decompress in this case)
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        csvText = gunzipSync(buffer).toString("utf-8");
      } else {
        // Either not gzip, or fetch auto-decompressed it
        csvText = await response.text();
      }

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

      // Bulk upsert products using raw SQL for efficiency
      let imported = 0;
      let failed = 0;
      const batchSize = 500; // Process 500 products per SQL statement

      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);

        try {
          // Build VALUES clause for bulk insert
          const values = batch.map((product) => {
            const availability = mapAvailability(product.availability);
            const searchText = buildSearchText(product);
            return `(
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
          }).join(",\n");

          await db.$executeRawUnsafe(`
            INSERT INTO "FeedProduct" (
              "providerId", "externalId", "ean", "title", "description",
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
          logger.error("Batch upsert error", batchError, {
            providerId: provider.providerId,
            batchIndex: i,
            batchSize: batch.length,
          });
          failed += batch.length;
        }

        // Update progress after each batch
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
