import { prisma } from "@/lib/db";
import { PLANS } from "@/lib/plans";

export interface MrrData {
  mrr: number; // In cents
  arr: number; // In cents
  activeSubscriptions: number;
  monthlySubscriptions: number;
  yearlySubscriptions: number;
  trialingSubscriptions: number;
}

export async function getMrrData(): Promise<MrrData> {
  const subscriptions = await prisma.subscription.findMany({
    where: {
      status: { in: ["ACTIVE", "TRIALING"] },
      // Exclude admin-managed subscriptions (they don't contribute to real revenue)
      NOT: { stripeSubscriptionId: { startsWith: "admin_" } },
    },
    select: {
      tier: true,
      interval: true,
      status: true,
    },
  });

  let mrr = 0;
  let monthlyCount = 0;
  let yearlyCount = 0;
  let trialingCount = 0;

  for (const sub of subscriptions) {
    // Trialing users don't contribute to MRR yet
    if (sub.status === "TRIALING") {
      trialingCount++;
      continue;
    }

    const planPricing = PLANS[sub.tier]?.pricing;
    if (!planPricing) continue;

    if (sub.interval === "MONTHLY") {
      mrr += planPricing.monthly;
      monthlyCount++;
    } else {
      // Yearly subscriptions: divide by 12 for MRR
      mrr += Math.round(planPricing.yearly / 12);
      yearlyCount++;
    }
  }

  return {
    mrr,
    arr: mrr * 12,
    activeSubscriptions: monthlyCount + yearlyCount,
    monthlySubscriptions: monthlyCount,
    yearlySubscriptions: yearlyCount,
    trialingSubscriptions: trialingCount,
  };
}

export function formatCurrency(
  cents: number,
  currency: string = "EUR"
): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}
