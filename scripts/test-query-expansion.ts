/**
 * Test query expansion functionality
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { getTypesenseClient, PRODUCTS_COLLECTION_NAME, expandQuery, getExpansionInfo } from "../src/lib/typesense";

async function search(query: string, expand: boolean = false) {
  const client = getTypesenseClient();
  const searchQuery = expand ? expandQuery(query) : query;

  const result = await client
    .collections(PRODUCTS_COLLECTION_NAME)
    .documents()
    .search({
      q: searchQuery,
      query_by: "title,brand,description",
      query_by_weights: "3,2,1",
      sort_by: "_text_match:desc,providerPriority:desc",
      per_page: 5,
    });

  return { searchQuery, hits: result.hits, found: result.found };
}

async function compareResults(query: string) {
  const expansion = getExpansionInfo(query);

  console.log(`\n${"═".repeat(60)}`);
  console.log(`Query: "${query}"`);
  if (expansion.wouldExpand) {
    console.log(`Expansion: "${query}" → "${expansion.expandedQuery}"`);
    console.log(`Detected: ${expansion.detectedProduct} → ${expansion.detectedBrand}`);
  } else {
    console.log(`Expansion: None (no known product detected)`);
  }
  console.log("═".repeat(60));

  // Without expansion
  const without = await search(query, false);
  console.log(`\nWithout expansion (q="${without.searchQuery}"):`);
  console.log(`Found: ${without.found} results`);
  without.hits?.slice(0, 5).forEach((hit, i) => {
    const doc = hit.document as Record<string, unknown>;
    const isMainProduct = String(doc.brand) === expansion.detectedBrand &&
      (String(doc.title).includes("128GB") || String(doc.title).includes("256GB") || String(doc.title).includes("512GB"));
    const marker = isMainProduct ? "✅" : "  ";
    console.log(`${marker} ${i + 1}. ${doc.title}`);
    console.log(`      Brand: ${doc.brand || "N/A"}`);
  });

  // With expansion
  if (expansion.wouldExpand) {
    const withExp = await search(query, true);
    console.log(`\nWith expansion (q="${withExp.searchQuery}"):`);
    console.log(`Found: ${withExp.found} results`);
    withExp.hits?.slice(0, 5).forEach((hit, i) => {
      const doc = hit.document as Record<string, unknown>;
      const isMainProduct = String(doc.brand) === expansion.detectedBrand &&
        (String(doc.title).includes("128GB") || String(doc.title).includes("256GB") || String(doc.title).includes("512GB"));
      const marker = isMainProduct ? "✅" : "  ";
      console.log(`${marker} ${i + 1}. ${doc.title}`);
      console.log(`      Brand: ${doc.brand || "N/A"}`);
    });
  }
}

async function main() {
  console.log("Testing Query Expansion for Product Search");
  console.log("✅ = Actual product (brand matches, has storage capacity)");

  // Test various queries
  await compareResults("iPhone");
  await compareResults("iPhone 16");
  await compareResults("Galaxy");
  await compareResults("AirPods");
  await compareResults("PlayStation");

  // Test query that shouldn't expand
  await compareResults("wireless headphones");
}

main().catch(console.error);
