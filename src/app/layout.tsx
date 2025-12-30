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
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <div className="relative min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
              <CookieBanner />
            </div>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
