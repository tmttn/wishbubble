/**
 * Product Search Module
 *
 * Multi-provider product search abstraction layer.
 * Supports real-time APIs (Bol.com, Amazon), product feeds (Awin),
 * and URL scraping as a fallback.
 */

// Types
export * from "./types";

// Registry
export { providerRegistry } from "./registry";

// Providers
export { ProductSearchProvider } from "./providers/base";
export { BolcomProvider } from "./providers/bolcom";
export { ScraperProvider } from "./providers/scraper";
export { AwinFeedProvider, createAwinProvider, loadAwinProviders } from "./providers/awin";

// CSV Parser
export { parseAwinCsv, mapAvailability, buildSearchText } from "./utils/csv-parser";
export type { AwinProduct, ParseResult } from "./utils/csv-parser";

// Initialize providers
import { providerRegistry } from "./registry";
import { BolcomProvider } from "./providers/bolcom";
import { ScraperProvider } from "./providers/scraper";
import { loadAwinProviders } from "./providers/awin";
import { logger } from "@/lib/logger";

// Register built-in providers
const bolcomProvider = new BolcomProvider();
const scraperProvider = new ScraperProvider();

providerRegistry.register(bolcomProvider);
providerRegistry.register(scraperProvider);

// Flag to track if feed providers have been loaded
let feedProvidersLoaded = false;

/**
 * Load and register feed providers from database
 * Called lazily on first search to avoid blocking startup
 */
async function ensureFeedProvidersLoaded(): Promise<void> {
  if (feedProvidersLoaded) return;

  try {
    const awinProviders = await loadAwinProviders();
    for (const provider of awinProviders) {
      providerRegistry.register(provider);
    }
    feedProvidersLoaded = true;
    logger.debug(`Loaded ${awinProviders.length} feed providers`);
  } catch (error) {
    logger.error("Failed to load feed providers", error);
  }
}

/**
 * Reload feed providers (call after importing new feeds)
 */
export async function reloadFeedProviders(): Promise<void> {
  feedProvidersLoaded = false;
  await ensureFeedProvidersLoaded();
}

// Convenience exports for common operations
import type { SearchOptions, AggregatedSearchResult, ProviderInfo, SearchProduct } from "./types";

/**
 * Search products across all enabled providers
 */
export async function searchProducts(options: SearchOptions): Promise<AggregatedSearchResult> {
  await ensureFeedProvidersLoaded();
  return providerRegistry.searchAll(options);
}

/**
 * Search a specific provider
 */
export async function searchProvider(providerId: string, options: SearchOptions): Promise<AggregatedSearchResult> {
  await ensureFeedProvidersLoaded();
  return providerRegistry.searchProvider(providerId, options);
}

/**
 * Get info for all registered providers
 */
export async function getProviders(): Promise<ProviderInfo[]> {
  await ensureFeedProvidersLoaded();
  return providerRegistry.getAllInfo();
}

/**
 * Lookup product by EAN across all providers
 */
export async function lookupByEan(ean: string): Promise<SearchProduct | null> {
  await ensureFeedProvidersLoaded();
  return providerRegistry.lookupByEan(ean);
}

/**
 * Find provider that matches a URL
 */
export function findProviderForUrl(url: string) {
  return providerRegistry.findProviderForUrl(url);
}

/**
 * Check if any search provider is available
 */
export async function isSearchAvailable(): Promise<boolean> {
  await ensureFeedProvidersLoaded();
  const providers = await providerRegistry.getEnabled();
  // Filter out scraper since it doesn't support search
  const searchProviders = providers.filter((p) => p.type !== "scraper");
  return searchProviders.length > 0;
}

/**
 * Scrape a URL using the scraper provider
 */
export async function scrapeProductUrl(url: string) {
  return scraperProvider.scrapeProductUrl(url);
}
