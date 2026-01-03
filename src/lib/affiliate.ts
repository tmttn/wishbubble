import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export interface AffiliateConfig {
  affiliateCode: string | null;
  affiliateParam: string | null;
  urlPatterns: string | null;
}

/**
 * Find a matching affiliate configuration for a URL
 * Returns the first matching provider's affiliate config, or null if no match
 */
export async function findAffiliateConfigForUrl(
  url: string
): Promise<AffiliateConfig | null> {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // Get all providers with affiliate configuration
    const providers = await prisma.productProvider.findMany({
      where: {
        enabled: true,
        affiliateCode: { not: null },
        urlPatterns: { not: null },
      },
      select: {
        affiliateCode: true,
        affiliateParam: true,
        urlPatterns: true,
        priority: true,
      },
      orderBy: { priority: "desc" },
    });

    // Find first matching provider
    for (const provider of providers) {
      if (!provider.urlPatterns) continue;

      const patterns = provider.urlPatterns
        .split(",")
        .map((p) => p.trim().toLowerCase());

      for (const pattern of patterns) {
        if (hostname.includes(pattern)) {
          return {
            affiliateCode: provider.affiliateCode,
            affiliateParam: provider.affiliateParam,
            urlPatterns: provider.urlPatterns,
          };
        }
      }
    }

    return null;
  } catch (error) {
    logger.error("Error finding affiliate config", error);
    return null;
  }
}

/**
 * Apply affiliate code to a URL based on the affiliate config
 *
 * If affiliateParam is set, adds ?param=code or &param=code (skips if already present with same value)
 * If affiliateParam is not set but affiliateCode is, appends the code as-is (skips if already in URL)
 *
 * Examples:
 * - affiliateParam: "ref", affiliateCode: "mysite" -> adds ?ref=mysite
 * - affiliateParam: null, affiliateCode: "tag=abc" -> appends &tag=abc
 */
export function applyAffiliateCode(
  url: string,
  config: AffiliateConfig
): string {
  if (!config.affiliateCode) {
    return url;
  }

  try {
    const urlObj = new URL(url);

    if (config.affiliateParam) {
      // Check if the parameter already exists with the correct value
      const existingValue = urlObj.searchParams.get(config.affiliateParam);
      if (existingValue === config.affiliateCode) {
        // Already has our affiliate code, no need to modify
        return url;
      }

      // Add/replace as a proper query parameter
      urlObj.searchParams.set(config.affiliateParam, config.affiliateCode);
      return urlObj.toString();
    } else {
      // Append as-is (for custom formats like "tag=abc&ref=xyz")
      // Remove leading ? or & from affiliateCode if present
      const code = config.affiliateCode.replace(/^[?&]/, "");

      // Check if the URL already contains this exact code segment
      const existingSearch = urlObj.search;
      if (existingSearch.includes(code)) {
        // Already has our affiliate code, no need to modify
        return url;
      }

      const separator = existingSearch ? "&" : "?";
      return `${urlObj.toString()}${separator}${code}`;
    }
  } catch (error) {
    logger.error("Error applying affiliate code", { url, error });
    return url;
  }
}

/**
 * Enhance a URL with affiliate code if a matching provider is found
 * This is the main function to use for automatic affiliate code application
 */
export async function enhanceUrlWithAffiliate(url: string): Promise<string> {
  const config = await findAffiliateConfigForUrl(url);

  if (!config) {
    return url;
  }

  return applyAffiliateCode(url, config);
}

/**
 * Check if a URL matches any affiliate provider patterns
 */
export function urlMatchesPatterns(url: string, patterns: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    const patternList = patterns.split(",").map((p) => p.trim().toLowerCase());

    return patternList.some((pattern) => hostname.includes(pattern));
  } catch {
    return false;
  }
}
