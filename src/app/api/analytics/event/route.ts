import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { z } from "zod";
import { cookies } from "next/headers";

const eventSchema = z.object({
  category: z.string().min(1).max(50),
  action: z.string().min(1).max(50),
  label: z.string().max(200).optional(),
  value: z.number().int().optional(),
  sessionId: z.string().min(1).max(100),
  page: z.string().max(500),
  referrer: z.string().max(500).optional(),
  deviceType: z.string().max(20).optional(),
});

const batchEventSchema = z.object({
  events: z.array(eventSchema).max(50),
});

// POST /api/analytics/event - Track a single event or batch of events
export async function POST(request: Request) {
  try {
    // Check cookie consent for analytics
    const cookieStore = await cookies();
    const consentCookie = cookieStore.get("cookie-consent");

    if (consentCookie) {
      try {
        const consent = JSON.parse(consentCookie.value);
        if (!consent.analytics) {
          // User has not consented to analytics
          return NextResponse.json({ ok: true, tracked: false });
        }
      } catch {
        // Invalid consent cookie, skip tracking
        return NextResponse.json({ ok: true, tracked: false });
      }
    }

    // Get user ID if authenticated
    const session = await auth();
    const userId = session?.user?.id || null;

    const body = await request.json();

    // Handle single event or batch
    let events: z.infer<typeof eventSchema>[];

    if (body.events) {
      const validated = batchEventSchema.safeParse(body);
      if (!validated.success) {
        return NextResponse.json({ ok: false }, { status: 400 });
      }
      events = validated.data.events;
    } else {
      const validated = eventSchema.safeParse(body);
      if (!validated.success) {
        return NextResponse.json({ ok: false }, { status: 400 });
      }
      events = [validated.data];
    }

    // Batch insert events
    await prisma.userEvent.createMany({
      data: events.map((event) => ({
        userId,
        sessionId: event.sessionId,
        category: event.category,
        action: event.action,
        label: event.label,
        value: event.value,
        page: event.page,
        referrer: event.referrer,
        deviceType: event.deviceType,
      })),
    });

    return NextResponse.json({ ok: true, tracked: true });
  } catch (error) {
    // Silent fail - analytics should never break the app
    logger.error("Analytics event tracking error", error);
    return NextResponse.json({ ok: true, tracked: false });
  }
}
