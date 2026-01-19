/**
 * Test different relevance tuning options
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { getTypesenseClient, PRODUCTS_COLLECTION_NAME } from "../src/lib/typesense";

async function testSearch(name: string, query: string, options: Record<string, unknown>) {
  const client = getTypesenseClient();

  const result = await client
    .collections(PRODUCTS_COLLECTION_NAME)
    .documents()
    .search({
      q: query,
      query_by: "title,brand,description",
      query_by_weights: "3,2,1",
      per_page: 5,
      ...options,
    });

  console.log(`\n${name}:`);
  console.log("─".repeat(50));
  result.hits?.forEach((hit, i) => {
    const doc = hit.document as Record<string, unknown>;
    const price = doc.price ? `€${Number(doc.price).toFixed(2)}` : "N/A";
    const isActualPhone = String(doc.title).includes("128GB") || String(doc.title).includes("256GB");
    const marker = isActualPhone ? "📱" : "  ";
    console.log(`${marker} ${i+1}. ${doc.title}`);
    console.log(`      Brand: ${doc.brand || "N/A"} | Price: ${price}`);
  });
}

async function main() {
  console.log("Testing relevance tuning options for 'iPhone' search\n");
  console.log("📱 = Actual iPhone (has storage capacity in title)");

  // Current default
  await testSearch("1. Current (default)", "iPhone", {
    sort_by: "_text_match:desc,providerPriority:desc",
  });

  // With prioritize_exact_match
  await testSearch("2. With prioritize_exact_match", "iPhone", {
    sort_by: "_text_match:desc,providerPriority:desc",
    prioritize_exact_match: true,
  });

  // Filter to Apple brand
  await testSearch("3. Filter to Apple brand only", "iPhone", {
    sort_by: "_text_match:desc,price:desc",
    filter_by: "brand:=Apple",
  });

  // Sort by price (expensive items first - actual phones cost more)
  await testSearch("4. Sort by price desc (expensive first)", "iPhone", {
    sort_by: "price:desc",
  });

  // Combine: text match + price
  await testSearch("5. Text match + price boost", "iPhone", {
    sort_by: "_text_match:desc,price:desc",
  });

  // Try searching for more specific query
  console.log("\n" + "═".repeat(60));
  console.log("COMPARISON: More specific queries");
  console.log("═".repeat(60));

  await testSearch("6. Search: 'Apple iPhone'", "Apple iPhone", {
    sort_by: "_text_match:desc,providerPriority:desc",
  });

  await testSearch("7. Search: 'iPhone 16'", "iPhone 16", {
    sort_by: "_text_match:desc,providerPriority:desc",
  });
}

main().catch(console.error);
