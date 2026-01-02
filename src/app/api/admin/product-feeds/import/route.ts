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
 * POST /api/admin/product-feeds/import
 *
 * Import products from Awin CSV feed
 *
 * Body: multipart/form-data
 * - file: CSV file
 * - providerId: Provider ID to import to
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

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const providerId = formData.get("providerId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!providerId) {
      return NextResponse.json(
        { error: "Provider ID is required" },
        { status: 400 }
      );
    }

    // Verify provider exists and is a feed type
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
        { error: "Provider is not a feed type. Only FEED providers support CSV import." },
        { status: 400 }
      );
    }

    // Create import log
    const importLog = await prisma.feedImportLog.create({
      data: {
        providerId: provider.id,
        fileName: file.name,
        fileSize: file.size,
        status: "PROCESSING",
        importedBy: adminResult.session!.user.id,
      },
    });

    logger.info("Starting feed import", {
      providerId: provider.providerId,
      fileName: file.name,
      fileSize: file.size,
      importLogId: importLog.id,
    });

    // Parse CSV
    const csvText = await file.text();
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

      logger.error("Feed import CSV parsing failed", parseError, {
        providerId: provider.providerId,
        fileName: file.name,
      });

      return NextResponse.json(
        { error: "Failed to parse CSV file", details: errorMessage },
        { status: 400 }
      );
    }

    const { products, errors: parseErrors } = parseResult;

    if (products.length === 0) {
      await prisma.feedImportLog.update({
        where: { id: importLog.id },
        data: {
          status: "FAILED",
          errorMessage: "No valid products found in CSV",
          recordsTotal: parseResult.totalRows,
          recordsFailed: parseResult.totalRows,
          completedAt: new Date(),
        },
      });

      return NextResponse.json(
        {
          error: "No valid products found in CSV",
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
        logger.error("Batch import error", batchError, {
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
        syncStatus: "SUCCESS",
        productCount,
      },
    });

    // Reload feed providers to pick up the new products
    await reloadFeedProviders();

    logger.info("Feed import completed", {
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
      parseErrors: parseErrors.slice(0, 10), // Return first 10 errors
    });
  } catch (error) {
    logger.error("Feed import error", error);
    return NextResponse.json(
      { error: "Failed to import feed" },
      { status: 500 }
    );
  }
}
