import type { CollectionCreateSchema } from "typesense/lib/Typesense/Collections";
import { getTypesenseClient } from "./client";

export const PRODUCTS_COLLECTION_NAME = "products";

/**
 * Typesense collection schema for products
 */
export const productsSchema: CollectionCreateSchema = {
  name: PRODUCTS_COLLECTION_NAME,
  fields: [
    // Searchable fields (with weights applied at query time)
    { name: "title", type: "string", facet: false },
    { name: "brand", type: "string", facet: true, optional: true },
    { name: "description", type: "string", facet: false, optional: true },

    // Filterable/Facetable fields
    { name: "category", type: "string", facet: true, optional: true },
    { name: "price", type: "float", facet: true, optional: true },
    { name: "availability", type: "string", facet: false, optional: true },

    // Sorting field - higher priority = shown first
    { name: "providerPriority", type: "int32" },

    // Metadata fields (for display, not searchable)
    { name: "providerId", type: "string", facet: true },
    { name: "providerName", type: "string", facet: false },
    { name: "imageUrl", type: "string", facet: false, optional: true },
    { name: "url", type: "string", facet: false },
    { name: "affiliateUrl", type: "string", facet: false },
    { name: "currency", type: "string", facet: false, optional: true },
    { name: "ean", type: "string", facet: false, optional: true },
  ],
  // Default sort by provider priority (commission-based)
  default_sorting_field: "providerPriority",
};

/**
 * TypeScript type for a product document in Typesense
 */
export interface TypesenseProduct {
  id: string; // FeedProduct database ID
  title: string;
  brand?: string;
  description?: string;
  category?: string;
  price?: number;
  availability?: string;
  providerPriority: number;
  providerId: string;
  providerName: string;
  imageUrl?: string;
  url: string;
  affiliateUrl: string;
  currency?: string;
  ean?: string;
}

/**
 * Ensure the products collection exists, creating it if necessary
 */
export async function ensureProductsCollection(): Promise<void> {
  const client = getTypesenseClient();

  try {
    const exists = await client.collections(PRODUCTS_COLLECTION_NAME).exists();
    if (exists) {
      console.log(`Collection "${PRODUCTS_COLLECTION_NAME}" already exists`);
      return;
    }
  } catch {
    // Collection doesn't exist, create it
  }

  try {
    await client.collections().create(productsSchema);
    console.log(`Collection "${PRODUCTS_COLLECTION_NAME}" created successfully`);
  } catch (error) {
    // Handle race condition where collection was created between check and create
    if (error instanceof Error && error.message.includes("already exists")) {
      console.log(`Collection "${PRODUCTS_COLLECTION_NAME}" already exists`);
      return;
    }
    throw error;
  }
}

/**
 * Delete and recreate the products collection (for full rebuild)
 */
export async function recreateProductsCollection(): Promise<void> {
  const client = getTypesenseClient();

  try {
    await client.collections(PRODUCTS_COLLECTION_NAME).delete();
    console.log(`Collection "${PRODUCTS_COLLECTION_NAME}" deleted`);
  } catch {
    // Collection might not exist, that's fine
  }

  await client.collections().create(productsSchema);
  console.log(`Collection "${PRODUCTS_COLLECTION_NAME}" recreated successfully`);
}
