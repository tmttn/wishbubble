import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { z } from "zod";
import { reloadFeedProviders } from "@/lib/product-search";

const createProviderSchema = z.object({
  providerId: z
    .string()
    .min(1)
    .max(50)
    .regex(
      /^[a-z0-9_]+$/,
      "Provider ID must be lowercase alphanumeric with underscores"
    ),
  name: z.string().min(1).max(100),
  type: z.enum(["REALTIME", "FEED", "SCRAPER"]),
  enabled: z.boolean().default(true),
  priority: z.number().min(0).max(100).default(0),
  feedUrl: z.string().url().optional().nullable(),
  affiliateCode: z.string().max(100).optional().nullable(),
  affiliateParam: z.string().max(50).optional().nullable(),
  urlPatterns: z.string().max(500).optional().nullable(),
});

/**
 * GET /api/admin/product-feeds
 *
 * List all product providers/feeds
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

    const providers = await prisma.productProvider.findMany({
      orderBy: [{ priority: "desc" }, { name: "asc" }],
      include: {
        _count: { select: { products: true } },
      },
    });

    // Get recent import logs for each provider
    const providerIds = providers.map((p) => p.id);
    const recentImports = await prisma.feedImportLog.findMany({
      where: { providerId: { in: providerIds } },
      orderBy: { startedAt: "desc" },
      take: providerIds.length * 3, // Last 3 imports per provider
    });

    const importsByProvider = new Map<string, typeof recentImports>();
    for (const log of recentImports) {
      const existing = importsByProvider.get(log.providerId) || [];
      if (existing.length < 3) {
        existing.push(log);
        importsByProvider.set(log.providerId, existing);
      }
    }

    const result = providers.map((provider) => ({
      ...provider,
      productCount: provider._count.products,
      recentImports: importsByProvider.get(provider.id) || [],
      _count: undefined,
    }));

    return NextResponse.json({ providers: result });
  } catch (error) {
    logger.error("Error fetching product providers", error);
    return NextResponse.json(
      { error: "Failed to fetch providers" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/product-feeds
 *
 * Create a new product provider
 */
export async function POST(request: NextRequest) {
  try {
    const adminResult = await requireAdminApi();
    if (adminResult.error) {
      return NextResponse.json(
        { error: adminResult.error },
        { status: adminResult.status }
      );
    }

    const body = await request.json();
    const validation = createProviderSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if provider ID already exists
    const existing = await prisma.productProvider.findUnique({
      where: { providerId: data.providerId },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A provider with this ID already exists" },
        { status: 409 }
      );
    }

    const provider = await prisma.productProvider.create({
      data: {
        providerId: data.providerId,
        name: data.name,
        type: data.type,
        enabled: data.enabled,
        priority: data.priority,
        feedUrl: data.feedUrl,
        affiliateCode: data.affiliateCode,
        affiliateParam: data.affiliateParam,
        urlPatterns: data.urlPatterns,
      },
    });

    // Reload feed providers to include the new one
    if (data.type === "FEED") {
      await reloadFeedProviders();
    }

    logger.info("Product provider created", {
      providerId: provider.providerId,
      name: provider.name,
      createdBy: adminResult.session!.user.id,
    });

    return NextResponse.json(provider, { status: 201 });
  } catch (error) {
    logger.error("Error creating product provider", error);
    return NextResponse.json(
      { error: "Failed to create provider" },
      { status: 500 }
    );
  }
}
