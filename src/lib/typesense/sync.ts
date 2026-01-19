import { FeedProduct, ProductProvider } from "@prisma/client";
import type { ImportResponse } from "typesense/lib/Typesense/Documents";
import { getTypesenseClient, isTypesenseEnabled } from "./client";
import {
  PRODUCTS_COLLECTION_NAME,
  TypesenseProduct,
  ensureProductsCollection,
} from "./schema";
import prisma from "@/lib/db";

const BATCH_SIZE = 1000;

type FeedProductWithProvider = FeedProduct & {
  provider: ProductProvider;
};

/**
 * Convert a FeedProduct to a Typesense document
 */
export function toTypesenseDocument(
  product: FeedProductWithProvider
): TypesenseProduct {
  return {
    id: product.id,
    title: product.title,
    brand: product.brand || undefined,
    description: product.description || undefined,
    category: product.category || undefined,
    price: product.price ? parseFloat(product.price.toString()) : undefined,
    availability: product.availability,
    providerPriority: product.provider.priority,
    providerId: product.provider.providerId,
    providerName: product.provider.name,
    imageUrl: product.imageUrl || undefined,
    url: product.url,
    affiliateUrl: product.affiliateUrl || product.url,
    currency: product.currency || undefined,
    ean: product.ean || undefined,
  };
}

/**
 * Sync a batch of products to Typesense
 * @returns Number of successfully synced documents
 */
export async function syncProductsToTypesense(
  products: FeedProductWithProvider[]
): Promise<{ success: number; failed: number }> {
  if (!isTypesenseEnabled()) {
    console.log("Typesense is disabled, skipping sync");
    return { success: 0, failed: 0 };
  }

  if (products.length === 0) {
    return { success: 0, failed: 0 };
  }

  const client = getTypesenseClient();
  await ensureProductsCollection();

  const documents = products.map(toTypesenseDocument);

  const results = await client
    .collections(PRODUCTS_COLLECTION_NAME)
    .documents()
    .import(documents, {
      action: "upsert",
      dirty_values: "coerce_or_reject",
    });

  const failed = results.filter((r: ImportResponse) => !r.success);
  if (failed.length > 0) {
    console.error(
      `Failed to sync ${failed.length} products:`,
      failed.slice(0, 5).map((f: ImportResponse) => f.error)
    );
  }

  return {
    success: results.filter((r: ImportResponse) => r.success).length,
    failed: failed.length,
  };
}

/**
 * Delete products from Typesense by their IDs
 */
export async function deleteProductsFromTypesense(
  productIds: string[]
): Promise<{ deleted: number }> {
  if (!isTypesenseEnabled() || productIds.length === 0) {
    return { deleted: 0 };
  }

  const client = getTypesenseClient();
  let deleted = 0;

  // Delete in batches
  for (let i = 0; i < productIds.length; i += BATCH_SIZE) {
    const batch = productIds.slice(i, i + BATCH_SIZE);
    const filterBy = `id:[${batch.join(",")}]`;

    try {
      const result = await client
        .collections(PRODUCTS_COLLECTION_NAME)
        .documents()
        .delete({ filter_by: filterBy });
      deleted += result.num_deleted;
    } catch (error) {
      console.error(`Failed to delete batch of ${batch.length} products:`, error);
    }
  }

  return { deleted };
}

/**
 * Full resync of all products from PostgreSQL to Typesense
 * This is the safety-net sync that runs daily
 */
export async function fullResync(): Promise<{
  synced: number;
  failed: number;
  deleted: number;
  duration: number;
}> {
  if (!isTypesenseEnabled()) {
    console.log("Typesense is disabled, skipping full resync");
    return { synced: 0, failed: 0, deleted: 0, duration: 0 };
  }

  const startTime = Date.now();
  console.log("Starting full Typesense resync...");

  await ensureProductsCollection();

  const client = getTypesenseClient();
  let totalSynced = 0;
  let totalFailed = 0;
  const syncedIds = new Set<string>();

  // Get total count for progress logging
  const totalProducts = await prisma.feedProduct.count();
  console.log(`Syncing ${totalProducts.toLocaleString()} products...`);

  // Sync in batches using cursor-based pagination
  let cursor: string | undefined;
  let batchNumber = 0;

  while (true) {
    const products = await prisma.feedProduct.findMany({
      take: BATCH_SIZE,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { id: "asc" },
      include: {
        provider: true,
      },
    });

    if (products.length === 0) break;

    const result = await syncProductsToTypesense(products);
    totalSynced += result.success;
    totalFailed += result.failed;

    // Track synced IDs for orphan detection
    products.forEach((p) => syncedIds.add(p.id));

    cursor = products[products.length - 1].id;
    batchNumber++;

    if (batchNumber % 10 === 0) {
      const progress = ((syncedIds.size / totalProducts) * 100).toFixed(1);
      console.log(
        `Progress: ${syncedIds.size.toLocaleString()}/${totalProducts.toLocaleString()} (${progress}%)`
      );
    }
  }

  // Find and delete orphaned documents (in Typesense but not in DB)
  let totalDeleted = 0;
  try {
    // Get all document IDs from Typesense
    const searchResult = await client
      .collections(PRODUCTS_COLLECTION_NAME)
      .documents()
      .search({
        q: "*",
        query_by: "title",
        per_page: 0,
        include_fields: "id",
        // Get total count
      });

    const typesenseTotal = searchResult.found;
    console.log(
      `Typesense has ${typesenseTotal.toLocaleString()} documents, DB has ${syncedIds.size.toLocaleString()}`
    );

    // If counts match roughly, skip expensive orphan detection
    if (Math.abs(typesenseTotal - syncedIds.size) > 100) {
      console.log("Significant count difference, running orphan detection...");

      // Fetch all IDs from Typesense in batches
      const typesenseIds = new Set<string>();
      let page = 1;
      const pageSize = 250;

      while (typesenseIds.size < typesenseTotal) {
        const pageResult = await client
          .collections(PRODUCTS_COLLECTION_NAME)
          .documents()
          .search({
            q: "*",
            query_by: "title",
            per_page: pageSize,
            page,
            include_fields: "id",
          });

        if (!pageResult.hits || pageResult.hits.length === 0) break;

        pageResult.hits.forEach((hit) => {
          const doc = hit.document as unknown as TypesenseProduct;
          if (doc && typeof doc.id === "string") {
            typesenseIds.add(doc.id);
          }
        });

        page++;
      }

      // Find orphans
      const orphanIds = [...typesenseIds].filter((id) => !syncedIds.has(id));
      if (orphanIds.length > 0) {
        console.log(`Found ${orphanIds.length} orphaned documents, deleting...`);
        const deleteResult = await deleteProductsFromTypesense(orphanIds);
        totalDeleted = deleteResult.deleted;
      }
    }
  } catch (error) {
    console.error("Error during orphan detection:", error);
  }

  const duration = Date.now() - startTime;
  console.log(
    `Full resync complete: ${totalSynced.toLocaleString()} synced, ${totalFailed} failed, ${totalDeleted} deleted in ${(duration / 1000).toFixed(1)}s`
  );

  return {
    synced: totalSynced,
    failed: totalFailed,
    deleted: totalDeleted,
    duration,
  };
}

/**
 * Sync products for a specific provider
 * Called after feed import completes
 */
export async function syncProviderProducts(
  providerDbId: string
): Promise<{ success: number; failed: number }> {
  if (!isTypesenseEnabled()) {
    return { success: 0, failed: 0 };
  }

  console.log(`Syncing products for provider ${providerDbId}...`);

  let totalSuccess = 0;
  let totalFailed = 0;
  let cursor: string | undefined;

  while (true) {
    const products = await prisma.feedProduct.findMany({
      where: { providerId: providerDbId },
      take: BATCH_SIZE,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { id: "asc" },
      include: {
        provider: true,
      },
    });

    if (products.length === 0) break;

    const result = await syncProductsToTypesense(products);
    totalSuccess += result.success;
    totalFailed += result.failed;

    cursor = products[products.length - 1].id;
  }

  console.log(
    `Provider sync complete: ${totalSuccess} synced, ${totalFailed} failed`
  );

  return { success: totalSuccess, failed: totalFailed };
}
