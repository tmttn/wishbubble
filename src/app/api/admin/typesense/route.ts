import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { logger } from "@/lib/logger";
import {
  isTypesenseEnabled,
  getTypesenseClient,
  fullResync,
  syncProviderProducts,
  PRODUCTS_COLLECTION_NAME,
} from "@/lib/typesense";
import prisma from "@/lib/db";

// Extend timeout to 300 seconds for large syncs
export const maxDuration = 300;

/**
 * GET /api/admin/typesense
 *
 * Get Typesense status and collection stats
 */
export async function GET() {
  try {
    const adminResult = await requireAdminApi();
    if (adminResult.error) {
      return NextResponse.json(
        { error: adminResult.error },
        { status: adminResult.status }
      );
    }

    const enabled = isTypesenseEnabled();

    if (!enabled) {
      return NextResponse.json({
        enabled: false,
        message: "Typesense is not configured. Set TYPESENSE_HOST, TYPESENSE_API_KEY, and TYPESENSE_ENABLED=true",
      });
    }

    try {
      const client = getTypesenseClient();

      // Get health status
      const health = await client.health.retrieve();

      // Get collection info
      let collectionInfo = null;
      try {
        const collection = await client
          .collections(PRODUCTS_COLLECTION_NAME)
          .retrieve();
        collectionInfo = {
          name: collection.name,
          numDocuments: collection.num_documents,
          fields: collection.fields?.length || 0,
        };
      } catch {
        // Collection might not exist yet
      }

      // Get DB product count for comparison
      const dbProductCount = await prisma.feedProduct.count();

      return NextResponse.json({
        enabled: true,
        healthy: health.ok,
        collection: collectionInfo,
        database: {
          productCount: dbProductCount,
        },
        syncStatus: collectionInfo
          ? {
              indexed: collectionInfo.numDocuments,
              total: dbProductCount,
              percentIndexed:
                dbProductCount > 0
                  ? Math.round((collectionInfo.numDocuments / dbProductCount) * 100)
                  : 0,
            }
          : null,
      });
    } catch (error) {
      logger.error("Failed to get Typesense status", error);
      return NextResponse.json({
        enabled: true,
        healthy: false,
        error: error instanceof Error ? error.message : "Connection failed",
      });
    }
  } catch (error) {
    logger.error("Typesense status error", error);
    return NextResponse.json(
      { error: "Failed to get Typesense status" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/typesense
 *
 * Trigger Typesense operations
 *
 * Body:
 * - { action: "full-resync" } - Full resync all products
 * - { action: "sync-provider", providerId: string } - Sync specific provider
 * - { action: "recreate-collection" } - Delete and recreate collection (use with caution)
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

    if (!isTypesenseEnabled()) {
      return NextResponse.json(
        { error: "Typesense is not enabled" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action, providerId } = body;

    if (!action) {
      return NextResponse.json(
        { error: "Action is required" },
        { status: 400 }
      );
    }

    switch (action) {
      case "full-resync": {
        logger.info("Starting Typesense full resync (admin triggered)", {
          userId: adminResult.session?.user.id,
        });

        const result = await fullResync();

        return NextResponse.json({
          success: true,
          action: "full-resync",
          ...result,
          durationSeconds: (result.duration / 1000).toFixed(1),
        });
      }

      case "sync-provider": {
        if (!providerId) {
          return NextResponse.json(
            { error: "providerId is required for sync-provider action" },
            { status: 400 }
          );
        }

        // Verify provider exists
        const provider = await prisma.productProvider.findUnique({
          where: { id: providerId },
        });

        if (!provider) {
          return NextResponse.json(
            { error: "Provider not found" },
            { status: 404 }
          );
        }

        logger.info("Starting Typesense provider sync (admin triggered)", {
          providerId: provider.providerId,
          userId: adminResult.session?.user.id,
        });

        const result = await syncProviderProducts(providerId);

        return NextResponse.json({
          success: true,
          action: "sync-provider",
          providerId: provider.providerId,
          providerName: provider.name,
          synced: result.success,
          failed: result.failed,
        });
      }

      case "recreate-collection": {
        const { recreateProductsCollection } = await import("@/lib/typesense");

        logger.warn("Recreating Typesense collection (admin triggered)", {
          userId: adminResult.session?.user.id,
        });

        await recreateProductsCollection();

        // Trigger full resync after recreation
        const result = await fullResync();

        return NextResponse.json({
          success: true,
          action: "recreate-collection",
          message: "Collection recreated and resynced",
          ...result,
          durationSeconds: (result.duration / 1000).toFixed(1),
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error("Typesense admin action error", error);
    return NextResponse.json(
      {
        error: "Failed to execute Typesense action",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
