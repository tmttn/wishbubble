import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing - WishBubble",
  description: "Choose the perfect plan for your gift-giving needs. Start free with groups up to 8 members, or upgrade to Premium for unlimited wishlists and Secret Santa features.",
  openGraph: {
    title: "Pricing - WishBubble",
    description: "Choose the perfect plan for your gift-giving needs. Free and Premium plans available.",
  },
  alternates: {
    canonical: "https://wish-bubble.app/pricing",
  },
};

// JSON-LD structured data for pricing page
const pricingJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "WishBubble Premium",
  "description": "Premium subscription for WishBubble - Unlimited wishlists, Secret Santa, and more",
  "image": "https://www.wish-bubble.app/icons/icon-512x512.png",
  "brand": {
    "@type": "Brand",
    "name": "WishBubble"
  },
  "offers": [
    {
      "@type": "Offer",
      "name": "Free Plan",
      "price": "0",
      "priceCurrency": "EUR",
      "description": "2 groups, 8 members per group, 3 wishlists"
    },
    {
      "@type": "Offer",
      "name": "Premium Monthly",
      "price": "4.99",
      "priceCurrency": "EUR",
      "priceValidUntil": "2026-12-31",
      "description": "10 groups, 25 members, unlimited wishlists, Secret Santa"
    },
    {
      "@type": "Offer",
      "name": "Premium Yearly",
      "price": "39.99",
      "priceCurrency": "EUR",
      "priceValidUntil": "2026-12-31",
      "description": "10 groups, 25 members, unlimited wishlists, Secret Santa - Save 33%"
    }
  ]
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingJsonLd) }}
      />
      {children}
    </>
  );
}
