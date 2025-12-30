import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/providers";
import { Navbar } from "@/components/layout/navbar";

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
  ],
  authors: [{ name: "WishBubble" }],
  openGraph: {
    title: "WishBubble - Group Wishlist for Secret Santa",
    description:
      "Create bubbles, share wishlists, and coordinate gift-giving for Secret Santa events.",
    type: "website",
    locale: "en_US",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          <div className="relative min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <footer className="border-t py-6">
              <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
                <p className="text-sm text-muted-foreground">
                  &copy; {new Date().getFullYear()} WishBubble. All rights reserved.
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <a href="/privacy" className="hover:underline">
                    Privacy
                  </a>
                  <a href="/terms" className="hover:underline">
                    Terms
                  </a>
                </div>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
