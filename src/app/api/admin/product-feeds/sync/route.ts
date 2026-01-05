import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import {
  parseAwinCsv,
  mapAvailability,
  buildSearchText,
  reloadFeedProviders,
} from "@/lib/product-search";

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

      // Update file size in import log
      await prisma.feedImportLog.update({
        where: { id: importLog.id },
        data: { fileSize },
      });

      logger.info("Feed downloaded successfully", {
        providerId: provider.providerId,
        fileSize,
      });
    } catch (fetchError) {
      const errorMessage =
        fetchError instanceof Error ? fetchError.message : "Failed to fetch feed URL";

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

      logger.error("Feed sync fetch failed", fetchError, {
        providerId: provider.providerId,
        feedUrl: provider.feedUrl,
      });

      return NextResponse.json(
        { error: "Failed to download feed", details: errorMessage },
        { status: 502 }
      );
    }

    // Parse CSV
    let parseResult;

    try {
      parseResult = await parseAwinCsv(csvText);
    } catch (parseError) {
      const errorMessage =
        parseError instanceof Error ? parseError.message : "CSV parsing failed";

      await prisma.feedImportLog.update({
        where: { id: importLog.id },
        data: {
          status: "FAILED",
          errorMessage,
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
      await prisma.feedImportLog.update({
        where: { id: importLog.id },
        data: {
          status: "FAILED",
          errorMessage: "No valid products found in feed",
          recordsTotal: parseResult.totalRows,
          recordsFailed: parseResult.totalRows,
          completedAt: new Date(),
        },
      });

      await prisma.productProvider.update({
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

    // Batch upsert products
    let imported = 0;
    let failed = 0;
    const batchSize = 100;

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);

      try {
        await prisma.$transaction(
          batch.map((product) =>
            prisma.feedProduct.upsert({
              where: {
                providerId_externalId: {
                  providerId: provider.id,
                  externalId: product.id,
                },
              },
              create: {
                providerId: provider.id,
                externalId: product.id,
                ean: product.ean || null,
                title: product.title,
                description: product.description || null,
                brand: product.brand || null,
                category: product.category || null,
                price: product.price,
                currency: product.currency || "EUR",
                originalPrice: product.originalPrice || null,
                url: product.url,
                affiliateUrl: product.affiliateUrl || null,
                imageUrl: product.imageUrl || null,
                availability: mapAvailability(product.availability),
                searchText: buildSearchText(product),
                rawData: JSON.parse(JSON.stringify(product)),
              },
              update: {
                ean: product.ean || null,
                title: product.title,
                description: product.description || null,
                brand: product.brand || null,
                category: product.category || null,
                price: product.price,
                currency: product.currency || "EUR",
                originalPrice: product.originalPrice || null,
                url: product.url,
                affiliateUrl: product.affiliateUrl || null,
                imageUrl: product.imageUrl || null,
                availability: mapAvailability(product.availability),
                searchText: buildSearchText(product),
                rawData: JSON.parse(JSON.stringify(product)),
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
    }

    // Update import log
    const finalStatus = failed === products.length ? "FAILED" : "COMPLETED";
    await prisma.feedImportLog.update({
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
    const productCount = await prisma.feedProduct.count({
      where: { providerId: provider.id },
    });

    await prisma.productProvider.update({
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
      imported,
      failed,
      total: products.length,
      productCount,
      parseErrors: parseErrors.slice(0, 10),
    });
  } catch (error) {
    logger.error("Feed sync error", error);
    return NextResponse.json(
      { error: "Failed to sync feed" },
      { status: 500 }
    );
  }
}
