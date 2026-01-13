import "dotenv/config";
import { prisma } from "../src/lib/db";

async function resetSubscriptions() {
  console.log("Starting subscription reset...\n");

  // 1. Delete all subscriptions
  const deletedSubscriptions = await prisma.subscription.deleteMany({});
  console.log(`Deleted ${deletedSubscriptions.count} subscription records`);

  // 2. Delete all transactions
  const deletedTransactions = await prisma.transaction.deleteMany({});
  console.log(`Deleted ${deletedTransactions.count} transaction records`);

  // 3. Reset user subscription fields
  const updatedUsers = await prisma.user.updateMany({
    data: {
      subscriptionTier: "BASIC",
      subscriptionEnds: null,
      stripeCustomerId: null,
    },
  });
  console.log(`Reset subscription fields for ${updatedUsers.count} users`);

  // 4. Delete coupon redemptions (if any exist for test coupons)
  try {
    const deletedRedemptions = await prisma.couponRedemption.deleteMany({});
    console.log(`Deleted ${deletedRedemptions.count} coupon redemptions`);
  } catch {
    console.log("No coupon redemptions table or already empty");
  }

  // 5. Delete test coupons (optional - keeping production coupons)
  // Uncomment if you want to clear coupons too:
  // const deletedCoupons = await prisma.coupon.deleteMany({});
  // console.log(`Deleted ${deletedCoupons.count} coupons`);

  console.log("\nSubscription reset complete!");
}

resetSubscriptions()
  .catch((error) => {
    console.error("Error resetting subscriptions:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
