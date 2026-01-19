export { getTypesenseClient, isTypesenseEnabled, resetTypesenseClient } from "./client";
export {
  PRODUCTS_COLLECTION_NAME,
  productsSchema,
  ensureProductsCollection,
  recreateProductsCollection,
  type TypesenseProduct,
} from "./schema";
export {
  toTypesenseDocument,
  syncProductsToTypesense,
  deleteProductsFromTypesense,
  fullResync,
  syncProviderProducts,
} from "./sync";
export { expandQuery, getExpansionInfo } from "./query-expansion";
