import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { logger } from "@/lib/logger";

// Awin feed list URL - this should be configured via environment variable
const AWIN_FEED_LIST_URL = process.env.AWIN_FEED_LIST_URL;

interface AwinFeed {
  advertiserId: string;
  advertiserName: string;
  region: string;
  membershipStatus: string;
  feedFormat: string;
  feedId: string;
  feedName: string;
  language: string;
  vertical: string;
  lastImported: string;
  lastChecked: string;
  productCount: number;
  url: string;
}

/**
 * GET /api/admin/product-feeds/awin-feeds
 *
 * Fetches and parses the Awin feed list to show available feeds
 */
export async function GET() {
  try {
    const adminResult = await requireAdminApi();
    if (adminResult.error) {
      return NextResponse.json(
        { error: adminResult.error },
        { status: adminResult.status }
      );
    }

    if (!AWIN_FEED_LIST_URL) {
      return NextResponse.json(
        { error: "AWIN_FEED_LIST_URL environment variable not configured" },
        { status: 500 }
      );
    }

    logger.info("Fetching Awin feed list", { url: AWIN_FEED_LIST_URL });

    const response = await fetch(AWIN_FEED_LIST_URL, {
      headers: {
        "User-Agent": "WishBubble/1.0 Feed Discovery",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const csvText = await response.text();
    const feeds = parseAwinFeedList(csvText);

    // Filter to only show joined/active feeds with products
    const activeFeeds = feeds.filter(
      (feed) =>
        feed.membershipStatus.toLowerCase() !== "not joined" &&
        feed.productCount > 0
    );

    // Sort by advertiser name
    activeFeeds.sort((a, b) => a.advertiserName.localeCompare(b.advertiserName));

    logger.info("Awin feed list fetched", {
      totalFeeds: feeds.length,
      activeFeeds: activeFeeds.length,
    });

    return NextResponse.json({
      feeds: activeFeeds,
      total: activeFeeds.length,
    });
  } catch (error) {
    logger.error("Failed to fetch Awin feed list", error);
    return NextResponse.json(
      { error: "Failed to fetch Awin feed list" },
      { status: 500 }
    );
  }
}

function parseAwinFeedList(csvText: string): AwinFeed[] {
  const lines = csvText.split("\n");
  if (lines.length < 2) return [];

  // Parse header to get column indices
  const header = parseCSVLine(lines[0]);
  const columnMap: Record<string, number> = {};
  header.forEach((col, index) => {
    columnMap[col.toLowerCase().trim()] = index;
  });

  const feeds: AwinFeed[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      const values = parseCSVLine(line);

      const feed: AwinFeed = {
        advertiserId: getColumnValue(values, columnMap, ["advertiser id", "advertiserid"]) || "",
        advertiserName: getColumnValue(values, columnMap, ["advertiser name", "advertisername"]) || "",
        region: getColumnValue(values, columnMap, ["primary region", "primaryregion", "region"]) || "",
        membershipStatus: getColumnValue(values, columnMap, ["membership status", "membershipstatus", "status"]) || "",
        feedFormat: getColumnValue(values, columnMap, ["datafeed format", "datafeedformat", "format"]) || "",
        feedId: getColumnValue(values, columnMap, ["feed id", "feedid"]) || "",
        feedName: getColumnValue(values, columnMap, ["feed name", "feedname"]) || "",
        language: getColumnValue(values, columnMap, ["language"]) || "",
        vertical: getColumnValue(values, columnMap, ["vertical"]) || "",
        lastImported: getColumnValue(values, columnMap, ["last imported", "lastimported"]) || "",
        lastChecked: getColumnValue(values, columnMap, ["last checked", "lastchecked"]) || "",
        productCount: parseInt(getColumnValue(values, columnMap, ["no of products", "noofproducts", "products"]) || "0", 10) || 0,
        url: getColumnValue(values, columnMap, ["url"]) || "",
      };

      if (feed.advertiserId && feed.url) {
        feeds.push(feed);
      }
    } catch {
      // Skip malformed lines
      continue;
    }
  }

  return feeds;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function getColumnValue(
  values: string[],
  columnMap: Record<string, number>,
  possibleNames: string[]
): string | undefined {
  for (const name of possibleNames) {
    const index = columnMap[name];
    if (index !== undefined && values[index] !== undefined) {
      return values[index];
    }
  }
  return undefined;
}
