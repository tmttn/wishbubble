import { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { getOccasionSlugs } from "@/lib/occasion-content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://wish-bubble.app";

  // During build phase, Prisma client is not available
  // Return empty guides array; sitemap will be regenerated at runtime
  const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

  // Fetch gift guides from database (skip during build)
  const guides = isBuildPhase
    ? []
    : await prisma.giftGuide.findMany({
        where: { isPublished: true },
        select: { slug: true, updatedAt: true },
      });

  // Get occasion slugs
  const occasionSlugs = getOccasionSlugs();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/gift-guides`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/occasions`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/cookies`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // Gift guide pages
  const guidePages: MetadataRoute.Sitemap = guides.map((guide) => ({
    url: `${baseUrl}/gift-guides/${guide.slug}`,
    lastModified: guide.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // Occasion pages
  const occasionPages: MetadataRoute.Sitemap = occasionSlugs.map((slug) => ({
    url: `${baseUrl}/occasions/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.9,
  }));

  return [...staticPages, ...guidePages, ...occasionPages];
}
