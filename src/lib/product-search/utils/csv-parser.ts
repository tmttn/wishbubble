/**
 * Awin CSV Parser
 *
 * Parses Awin product feed CSV files into structured product data.
 * Handles various column naming conventions used by different merchants.
 */

import { logger } from "@/lib/logger";

export interface AwinProduct {
  id: string;
  title: string;
  description?: string;
  price?: number;
  currency?: string;
  originalPrice?: number;
  url: string;
  affiliateUrl?: string;
  imageUrl?: string;
  ean?: string;
  brand?: string;
  category?: string;
  availability?: string;
}

// Awin CSV column mapping (column names vary by merchant)
const COLUMN_MAPPINGS: Record<string, keyof AwinProduct> = {
  // Product ID columns
  aw_product_id: "id",
  product_id: "id",
  merchant_product_id: "id",
  id: "id",

  // Title columns
  product_name: "title",
  title: "title",
  name: "title",

  // Description columns
  description: "description",
  product_description: "description",

  // Price columns
  search_price: "price",
  price: "price",
  current_price: "price",
  sale_price: "price",

  // Original/RRP price columns
  rrp_price: "originalPrice",
  was_price: "originalPrice",
  rrp: "originalPrice",
  original_price: "originalPrice",

  // Currency columns
  currency: "currency",
  price_currency: "currency",

  // URL columns
  merchant_deep_link: "url",
  product_url: "url",
  deeplink: "url",
  merchant_product_url: "url",

  // Affiliate URL columns
  aw_deep_link: "affiliateUrl",
  affiliate_link: "affiliateUrl",
  tracking_link: "affiliateUrl",

  // Image columns
  aw_image_url: "imageUrl",
  merchant_image_url: "imageUrl",
  image_url: "imageUrl",
  image: "imageUrl",

  // EAN columns
  ean: "ean",
  gtin: "ean",
  barcode: "ean",
  upc: "ean",

  // Brand columns
  brand_name: "brand",
  brand: "brand",
  manufacturer: "brand",

  // Category columns
  category_name: "category",
  merchant_category: "category",
  category: "category",
  product_category: "category",

  // Availability columns
  stock_status: "availability",
  in_stock: "availability",
  availability: "availability",
  stock_quantity: "availability",
};

export interface ParseResult {
  products: AwinProduct[];
  errors: string[];
  totalRows: number;
  parsedRows: number;
}

/**
 * Parse Awin CSV content into structured product data
 */
export async function parseAwinCsv(csvText: string): Promise<ParseResult> {
  const lines = csvText.split(/\r?\n/);
  const errors: string[] = [];

  if (lines.length < 2) {
    throw new Error("CSV file is empty or has no data rows");
  }

  // Parse header row
  const headers = parseCSVLine(lines[0]);

  // Map headers to our fields
  const columnMap = new Map<number, keyof AwinProduct>();

  headers.forEach((header, index) => {
    const normalizedHeader = header.toLowerCase().trim().replace(/['"]/g, "");
    const mapping = COLUMN_MAPPINGS[normalizedHeader];
    if (mapping) {
      columnMap.set(index, mapping);
    }
  });

  // Verify required fields
  const mappedFields = Array.from(columnMap.values());
  const hasId = mappedFields.includes("id");
  const hasTitle = mappedFields.includes("title");
  const hasUrl = mappedFields.includes("url");

  if (!hasId || !hasTitle || !hasUrl) {
    const missing: string[] = [];
    if (!hasId) missing.push("id");
    if (!hasTitle) missing.push("title");
    if (!hasUrl) missing.push("url");
    throw new Error(
      `CSV is missing required columns: ${missing.join(", ")}. ` +
        `Found headers: ${headers.slice(0, 10).join(", ")}...`
    );
  }

  // Parse data rows
  const products: AwinProduct[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      const values = parseCSVLine(line);
      const product: Partial<AwinProduct> = {};

      columnMap.forEach((field, index) => {
        const value = values[index]?.trim();
        if (!value) return;

        if (field === "price" || field === "originalPrice") {
          const numValue = parsePrice(value);
          if (numValue !== null) {
            product[field] = numValue;
          }
        } else if (field === "availability") {
          product[field] = value;
        } else {
          product[field] = value;
        }
      });

      if (product.id && product.title && product.url) {
        products.push(product as AwinProduct);
      } else {
        errors.push(`Row ${i + 1}: Missing required fields (id, title, or url)`);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      errors.push(`Row ${i + 1}: ${msg}`);
      logger.warn("Failed to parse CSV line", { line: i + 1, error: msg });
    }
  }

  return {
    products,
    errors,
    totalRows: lines.length - 1, // Exclude header
    parsedRows: products.length,
  };
}

/**
 * Parse a single CSV line, handling quoted values and escaped characters
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else if (char === '"') {
        // End of quoted section
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        // Start of quoted section
        inQuotes = true;
      } else if (char === ",") {
        // Field separator
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
  }

  // Add final field
  result.push(current.trim());

  return result;
}

/**
 * Parse price string to number, handling various formats
 */
function parsePrice(value: string): number | null {
  if (!value) return null;

  // Remove currency symbols and whitespace
  let cleaned = value.replace(/[€$£¥₹\s]/g, "").trim();

  // Handle European format (1.234,56) vs US format (1,234.56)
  const hasEuropeanFormat =
    cleaned.includes(",") &&
    (cleaned.indexOf(",") > cleaned.lastIndexOf(".") ||
      !cleaned.includes("."));

  if (hasEuropeanFormat) {
    // European format: replace . with nothing, replace , with .
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else {
    // US format: just remove commas
    cleaned = cleaned.replace(/,/g, "");
  }

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Map availability string to standardized format
 */
export function mapAvailability(
  availability?: string
): "IN_STOCK" | "OUT_OF_STOCK" | "UNKNOWN" {
  if (!availability) return "UNKNOWN";

  const lower = availability.toLowerCase();

  if (
    lower === "1" ||
    lower === "true" ||
    lower === "yes" ||
    lower.includes("in stock") ||
    lower.includes("available") ||
    lower.includes("in_stock") ||
    lower.includes("instock")
  ) {
    return "IN_STOCK";
  }

  if (
    lower === "0" ||
    lower === "false" ||
    lower === "no" ||
    lower.includes("out of stock") ||
    lower.includes("unavailable") ||
    lower.includes("out_of_stock") ||
    lower.includes("outofstock")
  ) {
    return "OUT_OF_STOCK";
  }

  return "UNKNOWN";
}

/**
 * Build searchable text from product data
 */
export function buildSearchText(product: AwinProduct): string {
  return [product.title, product.description, product.brand, product.category]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}
