import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { scrapeUrl } from "@/lib/url-scraper";
import { createLocalizedNotification } from "@/lib/notifications";
import { queuePriceDropEmail } from "@/lib/email/queue";
import { logger } from "@/lib/logger";
import * as Sentry from "@sentry/nextjs";

// This endpoint checks prices for items with price alerts enabled
// Schedule: Every 6 hours (0 */6 * * *)

const BATCH_SIZE = 50; // Process 50 items at a time
const MIN_PRICE_DROP_PERCENT = 10; // Only alert if price drops by at least 10%
const CHECK_INTERVAL_HOURS = 6; // Don't re-check items checked within this period

export async function GET(request: Request) {
  const checkInId = Sentry.captureCheckIn(
    {
      monitorSlug: "price-check",
      status: "in_progress",
    },
    {
      schedule: { type: "crontab", value: "0 */6 * * *" },
      maxRuntime: 10,
      timezone: "Etc/UTC",
    }
  );

  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      logger.warn("Unauthorized cron access attempt", { cron: "price-check" });
      Sentry.captureCheckIn({
        checkInId,
        monitorSlug: "price-check",
        status: "error",
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://wish-bubble.app";
    const checkThreshold = new Date(Date.now() - CHECK_INTERVAL_HOURS * 60 * 60 * 1000);

    // Find items with price alerts enabled that haven't been checked recently
    // Only for COMPLETE tier users with active subscriptions
    const items = await prisma.wishlistItem.findMany({
      where: {
        priceAlertEnabled: true,
        deletedAt: null,
        url: { not: null },
        price: { not: null }, // Only check items with a known price
        OR: [
          { lastPriceCheck: null },
          { lastPriceCheck: { lt: checkThreshold } },
        ],
        wishlist: {
          user: {
            subscriptionTier: "COMPLETE",
            // Check subscription status via the subscription relation
            subscription: {
              status: "ACTIVE",
            },
          },
        },
      },
      include: {
        wishlist: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                locale: true,
                notifyEmail: true,
                notifyInApp: true,
              },
            },
          },
        },
      },
      take: BATCH_SIZE,
      orderBy: [
        { lastPriceCheck: { sort: "asc", nulls: "first" } },
      ],
    });

    logger.info("Starting price check", { itemCount: items.length });

    let checkedCount = 0;
    let priceDropCount = 0;
    let errorCount = 0;

    for (const item of items) {
      try {
        if (!item.url) continue;

        // Scrape the current price
        const scrapedData = await scrapeUrl(item.url);

        // Update last check time regardless of result
        await prisma.wishlistItem.update({
          where: { id: item.id },
          data: { lastPriceCheck: new Date() },
        });
        checkedCount++;

        if (!scrapedData?.price) {
          continue;
        }

        const currentPrice = scrapedData.price;
        const oldPrice = Number(item.price);

        // Store price in history
        await prisma.priceHistory.create({
          data: {
            wishlistItemId: item.id,
            price: currentPrice,
            currency: scrapedData.currency || item.currency,
          },
        });

        // Check if price dropped significantly
        const priceDrop = oldPrice - currentPrice;
        const priceDropPercent = (priceDrop / oldPrice) * 100;

        if (priceDropPercent >= MIN_PRICE_DROP_PERCENT) {
          priceDropCount++;

          const user = item.wishlist.user;
          const percentOff = Math.round(priceDropPercent);

          // Create in-app notification
          if (user.notifyInApp) {
            await createLocalizedNotification(user.id, {
              type: "PRICE_DROP",
              messageType: "priceDrop",
              messageParams: {
                itemTitle: item.title,
                oldPrice: oldPrice.toFixed(2),
                newPrice: currentPrice.toFixed(2),
                percentOff,
              },
              itemId: item.id,
              url: `${baseUrl}/wishlist`,
            });
          }

          // Send email notification
          if (user.notifyEmail && user.email) {
            await queuePriceDropEmail({
              to: user.email,
              itemTitle: item.title,
              itemUrl: item.url,
              wishlistUrl: `${baseUrl}/wishlist`,
              oldPrice: oldPrice.toFixed(2),
              newPrice: currentPrice.toFixed(2),
              currency: item.currency,
              percentOff,
              locale: user.locale || "en",
            });
          }

          // Update item price to the new price
          await prisma.wishlistItem.update({
            where: { id: item.id },
            data: { price: currentPrice },
          });

          logger.info("Price drop detected", {
            itemId: item.id,
            title: item.title,
            oldPrice: oldPrice.toString(),
            newPrice: currentPrice.toString(),
            percentOff,
          });
        }
      } catch (error) {
        errorCount++;
        logger.error("Error checking item price", error, {
          itemId: item.id,
          url: item.url,
        });
      }
    }

    const result = {
      checked: checkedCount,
      priceDrops: priceDropCount,
      errors: errorCount,
    };

    logger.info("Price check complete", result);

    Sentry.captureCheckIn({
      checkInId,
      monitorSlug: "price-check",
      status: "ok",
    });

    return NextResponse.json(result);
  } catch (error) {
    logger.error("Price check cron failed", error);
    Sentry.captureException(error);
    Sentry.captureCheckIn({
      checkInId,
      monitorSlug: "price-check",
      status: "error",
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
