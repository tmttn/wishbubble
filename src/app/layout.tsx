import type { Metadata, Viewport } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Providers } from "@/components/layout/providers";
import { Navbar } from "@/components/layout/navbar";
import { CookieBanner } from "@/components/layout/cookie-banner";
import { Footer } from "@/components/layout/footer";
import { FeedbackButton } from "@/components/feedback/feedback-button";
import { SerwistProvider } from "@/lib/serwist-client";
import { AnalyticsProvider } from "@/components/analytics/analytics-provider";

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const sourceSans = Source_Sans_3({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "WishBubble - Share Wishlists, Coordinate Gifts",
  description:
    "Create gift groups for family, friends, or coworkers. Share wishlists, claim gifts secretly, and run Secret Santa draws. Free for groups up to 8 people.",
  keywords: [
    "wishlist",
    "secret santa",
    "gift exchange",
    "christmas",
    "birthday",
    "gift coordination",
    "verlanglijst",
    "sinterklaas",
  ],
  authors: [{ name: "WishBubble" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "WishBubble",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "WishBubble - Share Wishlists, Coordinate Gifts",
    description:
      "Create gift groups for family, friends, or coworkers. Share wishlists, claim gifts secretly, and run Secret Santa draws. Free for groups up to 8 people.",
    type: "website",
    locale: "en_US",
    alternateLocale: "nl_NL",
    siteName: "WishBubble",
  },
  twitter: {
    card: "summary_large_image",
    title: "WishBubble - Share Wishlists, Coordinate Gifts",
    description:
      "Create gift groups for family, friends, or coworkers. Share wishlists, claim gifts secretly, and run Secret Santa draws. Free for groups up to 8 people.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
        {/* Google Consent Mode v2 - must load before any Google scripts */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('consent', 'default', {
                'ad_storage': 'denied',
                'ad_user_data': 'denied',
                'ad_personalization': 'denied',
                'analytics_storage': 'denied',
                'wait_for_update': 500
              });
            `,
          }}
        />
        {process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}`}
            crossOrigin="anonymous"
          />
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "WishBubble",
              "description": "Create gift groups for family, friends, or coworkers. Share wishlists, claim gifts secretly, and run Secret Santa draws. Free for groups up to 8 people.",
              "url": "https://wish-bubble.app",
              "applicationCategory": "LifestyleApplication",
              "operatingSystem": "Any",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "featureList": [
                "Group-based wishlists",
                "Secret Santa draw",
                "Privacy-aware gift claiming",
                "Email invitations",
                "Multi-language support"
              ]
            }),
          }}
        />
      </head>
      <body className={`${fraunces.variable} ${sourceSans.variable} font-sans antialiased`}>
        <SerwistProvider swUrl="/serwist/sw.js">
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <AnalyticsProvider />
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-4 focus:left-4 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            >
              Skip to main content
            </a>
            <div className="relative min-h-screen flex flex-col">
              <Navbar />
              <main id="main-content" className="flex-1">{children}</main>
              <Footer />
              <CookieBanner />
              <FeedbackButton />
            </div>
          </Providers>
        </NextIntlClientProvider>
        </SerwistProvider>
        <Analytics />
      </body>
    </html>
  );
}
