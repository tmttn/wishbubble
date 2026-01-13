import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin";
import { z } from "zod";
import { logger } from "@/lib/logger";

const announcementImportItemSchema = z.object({
  titleEn: z.string().min(1).max(200),
  titleNl: z.string().min(1).max(200),
  bodyEn: z.string().min(1).max(5000),
  bodyNl: z.string().min(1).max(5000),
  imageUrl: z.string().url().optional().nullable(),
  ctaLabel: z.string().max(50).optional().nullable(),
  ctaUrl: z.string().url().optional().nullable(),
  targetTiers: z
    .array(z.enum(["BASIC", "PLUS", "COMPLETE"]))
    .default(["BASIC", "PLUS", "COMPLETE"]),
  publishedAt: z.string().datetime().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
  isActive: z.boolean().default(true),
  isReleaseNote: z.boolean().default(false),
});

const importAnnouncementsSchema = z.object({
  announcements: z.array(announcementImportItemSchema).min(1).max(100),
});

export type AnnouncementImportItem = z.infer<typeof announcementImportItemSchema>;

// POST /api/admin/announcements/import - Import announcements from JSON
export async function POST(request: Request) {
  try {
    const adminResult = await requireAdminApi();
    if (adminResult.error) {
      return NextResponse.json(
        { error: adminResult.error },
        { status: adminResult.status }
      );
    }

    const body = await request.json();
    const validation = importAnnouncementsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { announcements } = validation.data;

    const results = {
      total: announcements.length,
      imported: 0,
      failed: 0,
      errors: [] as { index: number; error: string }[],
      createdIds: [] as string[],
    };

    // Process each announcement
    for (let i = 0; i < announcements.length; i++) {
      const item = announcements[i];
      try {
        const created = await prisma.announcement.create({
          data: {
            titleEn: item.titleEn,
            titleNl: item.titleNl,
            bodyEn: item.bodyEn,
            bodyNl: item.bodyNl,
            imageUrl: item.imageUrl || null,
            ctaLabel: item.ctaLabel || null,
            ctaUrl: item.ctaUrl || null,
            targetTiers: item.targetTiers,
            publishedAt: item.publishedAt ? new Date(item.publishedAt) : new Date(),
            expiresAt: item.expiresAt ? new Date(item.expiresAt) : null,
            isActive: item.isActive,
            isReleaseNote: item.isReleaseNote,
          },
        });
        results.imported++;
        results.createdIds.push(created.id);
      } catch (error) {
        results.failed++;
        results.errors.push({
          index: i,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        logger.error(`Failed to import announcement at index ${i}`, error);
      }
    }

    logger.info(
      `Announcement import completed: ${results.imported}/${results.total} imported`
    );

    return NextResponse.json(results, {
      status: results.failed > 0 ? 207 : 201,
    });
  } catch (error) {
    logger.error("Error importing announcements", error);
    return NextResponse.json(
      { error: "Failed to import announcements" },
      { status: 500 }
    );
  }
}
