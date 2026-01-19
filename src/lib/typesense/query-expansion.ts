/**
 * Query Expansion for Product Search
 *
 * Expands user queries to include likely brand names, improving relevance
 * for product searches where the main product should rank higher than accessories.
 *
 * Example: "iPhone" → "Apple iPhone"
 */

/**
 * Mapping of product names/keywords to their brand names.
 * When a user searches for a product, we prepend the brand to boost
 * results where the brand matches.
 */
const PRODUCT_TO_BRAND: Record<string, string> = {
  // Apple products
  iphone: "Apple",
  ipad: "Apple",
  macbook: "Apple",
  airpods: "Apple",
  "apple watch": "Apple",
  imac: "Apple",
  "mac mini": "Apple",
  "mac studio": "Apple",
  "mac pro": "Apple",
  homepod: "Apple",

  // Samsung products
  galaxy: "Samsung",
  "galaxy s": "Samsung",
  "galaxy z": "Samsung",
  "galaxy fold": "Samsung",
  "galaxy flip": "Samsung",
  "galaxy tab": "Samsung",
  "galaxy watch": "Samsung",
  "galaxy buds": "Samsung",

  // Google products
  pixel: "Google",
  "pixel watch": "Google",
  "pixel buds": "Google",
  nest: "Google",
  chromecast: "Google",

  // Sony products
  playstation: "Sony",
  ps5: "Sony",
  ps4: "Sony",
  xperia: "Sony",
  walkman: "Sony",

  // Microsoft products
  xbox: "Microsoft",
  surface: "Microsoft",

  // Nintendo products
  switch: "Nintendo",

  // Other electronics
  kindle: "Amazon",
  echo: "Amazon",
  "fire tv": "Amazon",
  firestick: "Amazon",
  gopro: "GoPro",
  dyson: "Dyson",
  roomba: "iRobot",
  nespresso: "Nespresso",
  thermomix: "Vorwerk",
};

/**
 * Check if a query contains a known product name and expand it with the brand.
 *
 * @param query - The original search query
 * @returns The expanded query if a product match is found, otherwise the original query
 */
export function expandQuery(query: string): string {
  const lowerQuery = query.toLowerCase().trim();

  // Check for exact matches first (longer phrases)
  for (const [product, brand] of Object.entries(PRODUCT_TO_BRAND)) {
    // Skip if query already contains the brand
    if (lowerQuery.includes(brand.toLowerCase())) {
      return query;
    }

    // Check if query matches or contains the product name
    if (lowerQuery === product || lowerQuery.startsWith(product + " ")) {
      // Prepend brand to query
      return `${brand} ${query}`;
    }

    // Check if product is a word boundary match within the query
    // e.g., "iphone 16 pro" should match "iphone"
    const productRegex = new RegExp(`\\b${escapeRegex(product)}\\b`, "i");
    if (productRegex.test(lowerQuery)) {
      return `${brand} ${query}`;
    }
  }

  return query;
}

/**
 * Escape special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Check if query expansion is applicable for a query.
 * Returns info about what expansion would be applied.
 */
export function getExpansionInfo(query: string): {
  wouldExpand: boolean;
  originalQuery: string;
  expandedQuery: string;
  detectedProduct?: string;
  detectedBrand?: string;
} {
  const expanded = expandQuery(query);
  const wouldExpand = expanded !== query;

  if (wouldExpand) {
    const lowerQuery = query.toLowerCase().trim();
    for (const [product, brand] of Object.entries(PRODUCT_TO_BRAND)) {
      const productRegex = new RegExp(`\\b${escapeRegex(product)}\\b`, "i");
      if (productRegex.test(lowerQuery)) {
        return {
          wouldExpand: true,
          originalQuery: query,
          expandedQuery: expanded,
          detectedProduct: product,
          detectedBrand: brand,
        };
      }
    }
  }

  return {
    wouldExpand: false,
    originalQuery: query,
    expandedQuery: query,
  };
}
