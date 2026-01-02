import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { z } from "zod";
import { reloadFeedProviders } from "@/lib/product-search";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateProviderSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  enabled: z.boolean().optional(),
  priority: z.number().min(0).max(100).optional(),
  feedUrl: z.string().url().optional().nullable(),
});

/**
 * GET /api/admin/product-feeds/[id]
 *
 * Get a single product provider with details
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const adminResult = await requireAdminApi();
    if (adminResult.error) {
      return NextResponse.json(
        { error: adminResult.error },
        { status: adminResult.status }
      );
    }

    const { id } = await params;

    const provider = await prisma.productProvider.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true } },
      },
    });

    if (!provider) {
      return NextResponse.json(
        { error: "Provider not found" },
        { status: 404 }
      );
    }

    // Get import logs
    const importLogs = await prisma.feedImportLog.findMany({
      where: { providerId: id },
      orderBy: { startedAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      ...provider,
      productCount: provider._count.products,
      importLogs,
      _count: undefined,
    });
  } catch (error) {
    logger.error("Error fetching product provider", error);
    return NextResponse.json(
      { error: "Failed to fetch provider" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/product-feeds/[id]
 *
 * Update a product provider
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const adminResult = await requireAdminApi();
    if (adminResult.error) {
      return NextResponse.json(
        { error: adminResult.error },
        { status: adminResult.status }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validation = updateProviderSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.issues },
        { status: 400 }
      );
    }

    const existing = await prisma.productProvider.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Provider not found" },
        { status: 404 }
      );
    }

    const provider = await prisma.productProvider.update({
      where: { id },
      data: validation.data,
    });

    // Reload feed providers if it's a feed provider
    if (provider.type === "FEED") {
      await reloadFeedProviders();
    }

    logger.info("Product provider updated", {
      providerId: provider.providerId,
      updatedBy: adminResult.session!.user.id,
    });

    return NextResponse.json(provider);
  } catch (error) {
    logger.error("Error updating product provider", error);
    return NextResponse.json(
      { error: "Failed to update provider" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/product-feeds/[id]
 *
 * Delete a product provider and all its products
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const adminResult = await requireAdminApi();
    if (adminResult.error) {
      return NextResponse.json(
        { error: adminResult.error },
        { status: adminResult.status }
      );
    }

    const { id } = await params;

    const existing = await prisma.productProvider.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Provider not found" },
        { status: 404 }
      );
    }

    // Delete the provider (cascade will delete products)
    await prisma.productProvider.delete({
      where: { id },
    });

    // Reload feed providers
    if (existing.type === "FEED") {
      await reloadFeedProviders();
    }

    logger.info("Product provider deleted", {
      providerId: existing.providerId,
      productCount: existing._count.products,
      deletedBy: adminResult.session!.user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error deleting product provider", error);
    return NextResponse.json(
      { error: "Failed to delete provider" },
      { status: 500 }
    );
  }
}
