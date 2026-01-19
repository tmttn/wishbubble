/**
 * Test Typesense search functionality
 *
 * Usage:
 *   DOTENV_CONFIG_PATH=.env.local npx tsx -r dotenv/config scripts/test-typesense-search.ts "query"
 */

import { getTypesenseClient, PRODUCTS_COLLECTION_NAME } from "../src/lib/typesense";

async function main() {
  const query = process.argv[2] || "iPhone";

  console.log(`\nSearching for: "${query}"\n`);
  console.log("─".repeat(60));

  const client = getTypesenseClient();

  const result = await client
    .collections(PRODUCTS_COLLECTION_NAME)
    .documents()
    .search({
      q: query,
      query_by: "title,brand,description",
      query_by_weights: "3,2,1",
      sort_by: "_text_match:desc,providerPriority:desc",
      per_page: 10,
      facet_by: "category,brand",
      max_facet_values: 5,
      num_typos: 2,
      prefix: true,
    });

  console.log(`Found: ${result.found.toLocaleString()} products`);
  console.log(`Showing top ${result.hits?.length || 0} results:\n`);

  if (result.hits) {
    for (const hit of result.hits) {
      const doc = hit.document as Record<string, unknown>;
      const price = doc.price ? `€${Number(doc.price).toFixed(2)}` : "N/A";
      console.log(`  • ${doc.title}`);
      console.log(`    Brand: ${doc.brand || "N/A"} | Price: ${price}`);
      console.log(`    Provider: ${doc.providerName} (priority: ${doc.providerPriority})`);
      console.log("");
    }
  }

  // Show facets
  if (result.facet_counts && result.facet_counts.length > 0) {
    console.log("─".repeat(60));
    console.log("Facets:\n");
    for (const facet of result.facet_counts) {
      console.log(`  ${facet.field_name}:`);
      for (const count of facet.counts.slice(0, 5)) {
        console.log(`    - ${count.value}: ${count.count}`);
      }
      console.log("");
    }
  }
}

main().catch(console.error);
