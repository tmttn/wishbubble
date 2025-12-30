import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";
import { Providers } from "@/components/layout/providers";
import { Navbar } from "@/components/layout/navbar";
import { CookieBanner } from "@/components/layout/cookie-banner";
import { Footer } from "@/components/layout/footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WishBubble - Group Wishlist for Secret Santa",
  description:
    "Create bubbles, share wishlists, and coordinate gift-giving for Secret Santa events. The group-first wishlist platform.",
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
    title: "WishBubble - Group Wishlist for Secret Santa",
    description:
      "Create bubbles, share wishlists, and coordinate gift-giving for Secret Santa events.",
    type: "website",
    locale: "en_US",
    alternateLocale: "nl_NL",
    siteName: "WishBubble",
  },
  twitter: {
    card: "summary_large_image",
    title: "WishBubble - Group Wishlist for Secret Santa",
    description:
      "Create bubbles, share wishlists, and coordinate gift-giving for Secret Santa events.",
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
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-96x96.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-72x72.png" />
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
              "description": "Create bubbles, share wishlists, and coordinate gift-giving for Secret Santa events. The group-first wishlist platform.",
              "url": "https://wishlist-tmttn.vercel.app",
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
      <body className={`${inter.variable} font-sans antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <Providers>
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
            </div>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
