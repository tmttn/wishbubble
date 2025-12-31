/**
 * Bol.com Marketing Catalog API Client
 *
 * Provides product search and affiliate link generation for Bol.com products.
 *
 * Required environment variables:
 * - BOLCOM_CLIENT_ID: OAuth2 client ID from Bol.com affiliate dashboard
 * - BOLCOM_CLIENT_SECRET: OAuth2 client secret
 * - BOLCOM_SITE_ID: Your affiliate site ID for tracking
 */

const TOKEN_URL = "https://login.bol.com/token?grant_type=client_credentials";
const API_BASE_URL = "https://api.bol.com/marketing/catalog/v1";

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface BolProduct {
  ean: string;
  bolProductId: number;
  title: string;
  url: string;
  description?: string;
  specsTag?: string;
  image?: {
    mimeType: string;
    width: number;
    height: number;
    url: string;
  };
  rating?: {
    average: number;
    count: number;
  };
  offer?: {
    price: number;
    strikethroughPrice?: number;
    currency: string;
    deliveryDescription?: string;
    sellerType?: string;
  };
}

interface SearchResponse {
  products: BolProduct[];
  totalResultSize: number;
  page: number;
  pageSize: number;
}

// Token cache
let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Get OAuth2 access token (with caching)
 */
async function getAccessToken(): Promise<string> {
  const clientId = process.env.BOLCOM_CLIENT_ID;
  const clientSecret = process.env.BOLCOM_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Bol.com API credentials not configured");
  }

  // Check cache (with 30 second buffer before expiry)
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30000) {
    return cachedToken.token;
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get Bol.com access token: ${response.status}`);
  }

  const data: TokenResponse = await response.json();

  // Cache the token
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return data.access_token;
}

/**
 * Search for products on Bol.com
 */
export async function searchProducts(
  searchTerm: string,
  options: {
    countryCode?: "NL" | "BE";
    page?: number;
    pageSize?: number;
    sort?: "RELEVANCE" | "POPULARITY" | "PRICE_ASC" | "PRICE_DESC" | "RATING";
  } = {}
): Promise<SearchResponse> {
  const token = await getAccessToken();

  const params = new URLSearchParams({
    "search-term": searchTerm,
    "country-code": options.countryCode || "NL",
    page: String(options.page || 1),
    "page-size": String(Math.min(options.pageSize || 12, 50)),
    sort: options.sort || "RELEVANCE",
    "include-offer": "true",
    "include-media": "true",
    "include-rating": "true",
  });

  const response = await fetch(`${API_BASE_URL}/products/search?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Accept-Language": "nl",
    },
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }
    throw new Error(`Bol.com API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Get product details by EAN
 */
export async function getProductByEan(
  ean: string,
  countryCode: "NL" | "BE" = "NL"
): Promise<BolProduct | null> {
  const token = await getAccessToken();

  const params = new URLSearchParams({
    "country-code": countryCode,
    "include-offer": "true",
    "include-media": "true",
    "include-rating": "true",
  });

  const response = await fetch(`${API_BASE_URL}/products/${ean}?${params}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Accept-Language": "nl",
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`Bol.com API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Generate affiliate tracking link
 *
 * Format: https://partner.bol.com/click/click?p=1&t=url&s=SITE_ID&url=PRODUCT_URL&f=TXL
 */
export function generateAffiliateLink(productUrl: string, subId?: string): string {
  const siteId = process.env.BOLCOM_SITE_ID;

  if (!siteId) {
    // Return original URL if affiliate not configured
    return productUrl;
  }

  const params = new URLSearchParams({
    p: "1",
    t: "url",
    s: siteId,
    url: productUrl,
    f: "TXL",
  });

  if (subId) {
    params.set("subid", subId);
  }

  return `https://partner.bol.com/click/click?${params}`;
}

/**
 * Check if a URL is a Bol.com product URL
 */
export function isBolcomUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname.endsWith("bol.com");
  } catch {
    return false;
  }
}

/**
 * Extract EAN from a Bol.com product URL
 * Example URL: https://www.bol.com/nl/nl/p/product-name/9300000123456789/
 */
export function extractEanFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const pathParts = parsed.pathname.split("/").filter(Boolean);

    // The EAN/product ID is typically the last numeric segment
    for (let i = pathParts.length - 1; i >= 0; i--) {
      const part = pathParts[i];
      // Bol.com product IDs are typically 13-16 digits
      if (/^\d{13,16}$/.test(part)) {
        return part;
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Transform product for wishlist item format
 */
export function transformToWishlistItem(product: BolProduct): {
  title: string;
  description?: string;
  price?: number;
  currency: string;
  url: string;
  imageUrl?: string;
} {
  const siteId = process.env.BOLCOM_SITE_ID;

  return {
    title: product.title,
    description: product.specsTag || product.description,
    price: product.offer?.price,
    currency: product.offer?.currency || "EUR",
    url: siteId ? generateAffiliateLink(product.url) : product.url,
    imageUrl: product.image?.url,
  };
}

/**
 * Check if Bol.com API is configured
 */
export function isBolcomConfigured(): boolean {
  return !!(
    process.env.BOLCOM_CLIENT_ID &&
    process.env.BOLCOM_CLIENT_SECRET
  );
}
