/**
 * URL Scraping Utility
 *
 * Extracts product metadata from URLs using Open Graph, JSON-LD, and meta tags.
 * Works with most major retailers (Amazon, Coolblue, MediaMarkt, etc.)
 */

import { prisma } from "@/lib/db";

export interface ScrapedProductData {
  title?: string;
  description?: string;
  price?: number;
  currency?: string;
  imageUrl?: string;
  siteName?: string;
}

/**
 * Scrape product metadata from a URL
 *
 * Priority order:
 * 1. Check database cache
 * 2. Fetch and parse the page
 * 3. Extract from JSON-LD (Schema.org Product)
 * 4. Extract from Open Graph tags
 * 5. Extract from standard meta tags
 */
export async function scrapeUrl(url: string): Promise<ScrapedProductData | null> {
  // Check cache first
  const cached = await prisma.scrapedProduct.findUnique({
    where: { url },
  });

  if (cached && cached.expiresAt > new Date()) {
    return {
      title: cached.title || undefined,
      description: cached.description || undefined,
      price: cached.price ? Number(cached.price) : undefined,
      currency: cached.currency || undefined,
      imageUrl: cached.imageUrl || undefined,
    };
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "nl-NL,nl;q=0.9,en;q=0.8",
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      console.error(`Failed to fetch URL: ${response.status}`);
      return null;
    }

    const html = await response.text();
    const data = parseHtml(html);

    // Cache the result (expire after 24 hours)
    if (data.title) {
      await prisma.scrapedProduct.upsert({
        where: { url },
        create: {
          url,
          title: data.title,
          description: data.description,
          price: data.price,
          currency: data.currency || "EUR",
          imageUrl: data.imageUrl,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
        update: {
          title: data.title,
          description: data.description,
          price: data.price,
          currency: data.currency || "EUR",
          imageUrl: data.imageUrl,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          updatedAt: new Date(),
        },
      });
    }

    return data;
  } catch (error) {
    console.error("Error scraping URL:", error);
    return null;
  }
}

/**
 * Parse HTML and extract product metadata
 */
function parseHtml(html: string): ScrapedProductData {
  const data: ScrapedProductData = {};

  // Try JSON-LD first (most reliable for e-commerce)
  const jsonLdData = extractJsonLd(html);
  if (jsonLdData) {
    Object.assign(data, jsonLdData);
  }

  // Fill in missing data from Open Graph
  const ogData = extractOpenGraph(html);
  if (!data.title && ogData.title) data.title = ogData.title;
  if (!data.description && ogData.description) data.description = ogData.description;
  if (!data.imageUrl && ogData.imageUrl) data.imageUrl = ogData.imageUrl;
  if (ogData.siteName) data.siteName = ogData.siteName;

  // Fill in from standard meta tags
  const metaData = extractMetaTags(html);
  if (!data.title && metaData.title) data.title = metaData.title;
  if (!data.description && metaData.description) data.description = metaData.description;

  // Clean up the data
  if (data.title) {
    data.title = cleanText(data.title);
    // Truncate to 200 chars
    if (data.title.length > 200) {
      data.title = data.title.substring(0, 197) + "...";
    }
  }

  if (data.description) {
    data.description = cleanText(data.description);
    // Truncate to 1000 chars
    if (data.description.length > 1000) {
      data.description = data.description.substring(0, 997) + "...";
    }
  }

  return data;
}

/**
 * Extract product data from JSON-LD (Schema.org)
 */
function extractJsonLd(html: string): ScrapedProductData | null {
  const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const jsonText = match[1].trim();
      const json = JSON.parse(jsonText);

      // Handle both single object and array of objects
      const items = Array.isArray(json) ? json : [json];

      for (const item of items) {
        // Look for Product type
        if (item["@type"] === "Product" || item["@type"]?.includes?.("Product")) {
          return extractProductFromSchema(item);
        }

        // Check @graph array (common in some implementations)
        if (item["@graph"]) {
          for (const graphItem of item["@graph"]) {
            if (graphItem["@type"] === "Product" || graphItem["@type"]?.includes?.("Product")) {
              return extractProductFromSchema(graphItem);
            }
          }
        }
      }
    } catch {
      // Invalid JSON, continue to next script
    }
  }

  return null;
}

/**
 * Extract product data from a Schema.org Product object
 */
function extractProductFromSchema(product: Record<string, unknown>): ScrapedProductData {
  const data: ScrapedProductData = {};

  // Title
  if (typeof product.name === "string") {
    data.title = product.name;
  }

  // Description
  if (typeof product.description === "string") {
    data.description = product.description;
  }

  // Image
  if (typeof product.image === "string") {
    data.imageUrl = product.image;
  } else if (Array.isArray(product.image) && typeof product.image[0] === "string") {
    data.imageUrl = product.image[0];
  } else if (typeof product.image === "object" && product.image !== null) {
    const imgObj = product.image as Record<string, unknown>;
    if (typeof imgObj.url === "string") {
      data.imageUrl = imgObj.url;
    }
  }

  // Price from offers
  const offers = product.offers;
  if (offers) {
    const offerObj = Array.isArray(offers) ? offers[0] : offers;
    if (typeof offerObj === "object" && offerObj !== null) {
      const offer = offerObj as Record<string, unknown>;

      if (typeof offer.price === "number") {
        data.price = offer.price;
      } else if (typeof offer.price === "string") {
        data.price = parsePrice(offer.price);
      } else if (typeof offer.lowPrice === "number") {
        data.price = offer.lowPrice;
      } else if (typeof offer.lowPrice === "string") {
        data.price = parsePrice(offer.lowPrice);
      }

      if (typeof offer.priceCurrency === "string") {
        data.currency = offer.priceCurrency;
      }
    }
  }

  return data;
}

/**
 * Extract data from Open Graph meta tags
 */
function extractOpenGraph(html: string): ScrapedProductData {
  const data: ScrapedProductData = {};

  // og:title
  const titleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i);
  if (titleMatch) data.title = titleMatch[1];

  // og:description
  const descMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i);
  if (descMatch) data.description = descMatch[1];

  // og:image
  const imgMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i);
  if (imgMatch) data.imageUrl = imgMatch[1];

  // og:site_name
  const siteMatch = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']*)["']/i);
  if (siteMatch) data.siteName = siteMatch[1];

  // og:price:amount (some sites use this)
  const priceMatch = html.match(/<meta[^>]*property=["'](?:og:price:amount|product:price:amount)["'][^>]*content=["']([^"']*)["']/i);
  if (priceMatch) data.price = parsePrice(priceMatch[1]);

  // og:price:currency
  const currencyMatch = html.match(/<meta[^>]*property=["'](?:og:price:currency|product:price:currency)["'][^>]*content=["']([^"']*)["']/i);
  if (currencyMatch) data.currency = currencyMatch[1];

  return data;
}

/**
 * Extract data from standard meta tags
 */
function extractMetaTags(html: string): ScrapedProductData {
  const data: ScrapedProductData = {};

  // <title> tag
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  if (titleMatch) data.title = titleMatch[1];

  // meta description
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
  if (descMatch) data.description = descMatch[1];

  return data;
}

/**
 * Parse a price string to number
 */
function parsePrice(priceStr: string): number | undefined {
  // Remove currency symbols and thousand separators
  const cleaned = priceStr
    .replace(/[€$£¥₹]/g, "")
    .replace(/\s/g, "")
    .replace(/,(\d{2})$/, ".$1") // Convert European comma decimal
    .replace(/,/g, "") // Remove thousand separators
    .trim();

  const price = parseFloat(cleaned);
  return isNaN(price) ? undefined : price;
}

/**
 * Clean up text (decode HTML entities, normalize whitespace)
 */
function cleanText(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Detect the retailer from a URL
 */
export function detectRetailer(url: string): string | null {
  try {
    const hostname = new URL(url).hostname.toLowerCase();

    const retailers: Record<string, string> = {
      "bol.com": "bolcom",
      "amazon": "amazon",
      "coolblue": "coolblue",
      "mediamarkt": "mediamarkt",
      "wehkamp": "wehkamp",
      "zalando": "zalando",
      "hema": "hema",
      "ikea": "ikea",
      "albert heijn": "ah",
      "ah.nl": "ah",
      "jumbo": "jumbo",
      "kruidvat": "kruidvat",
      "action": "action",
      "aliexpress": "aliexpress",
      "wish": "wish",
    };

    for (const [pattern, retailer] of Object.entries(retailers)) {
      if (hostname.includes(pattern)) {
        return retailer;
      }
    }

    return null;
  } catch {
    return null;
  }
}
