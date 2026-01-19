/**
 * Test Typesense connection and optionally run initial sync
 *
 * Usage:
 *   npx tsx scripts/test-typesense.ts          # Test connection only
 *   npx tsx scripts/test-typesense.ts --sync   # Test and run full sync
 */

// Load environment variables - must be before any other imports
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { isTypesenseEnabled, getTypesenseClient } from "../src/lib/typesense/client";
import { fullResync } from "../src/lib/typesense/sync";

async function main() {
  console.log("Testing Typesense connection...\n");

  // Check if enabled
  const enabled = isTypesenseEnabled();
  console.log(`Typesense enabled: ${enabled}`);

  if (!enabled) {
    console.error("\nTypesense is not configured. Please set:");
    console.error("  - TYPESENSE_HOST");
    console.error("  - TYPESENSE_API_KEY");
    console.error("  - TYPESENSE_ENABLED=true");
    process.exit(1);
  }

  try {
    // Get client and test health
    const client = getTypesenseClient();
    const health = await client.health.retrieve();
    console.log(`Health check: ${health.ok ? "OK" : "FAILED"}`);

    // Check for existing collection
    try {
      const collections = await client.collections().retrieve();
      console.log(`\nExisting collections: ${collections.length}`);
      for (const col of collections) {
        console.log(`  - ${col.name}: ${col.num_documents} documents`);
      }
    } catch (error) {
      console.log("Could not retrieve collections:", error);
    }

    console.log("\n✓ Typesense connection successful!");

    // Check if --sync flag is passed
    if (process.argv.includes("--sync")) {
      console.log("\n--- Starting full sync ---\n");
      const result = await fullResync();
      console.log("\n--- Sync complete ---");
      console.log(`  Synced: ${result.synced.toLocaleString()}`);
      console.log(`  Failed: ${result.failed}`);
      console.log(`  Deleted: ${result.deleted}`);
      console.log(`  Duration: ${(result.duration / 1000).toFixed(1)}s`);
    } else {
      console.log("\nRun with --sync flag to perform initial sync:");
      console.log("  npx tsx scripts/test-typesense.ts --sync");
    }

  } catch (error) {
    console.error("\n✗ Typesense connection failed:");
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
