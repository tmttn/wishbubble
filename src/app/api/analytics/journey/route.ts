import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { z } from "zod";
import { cookies } from "next/headers";
import { USER_JOURNEYS, type JourneyType } from "@/lib/journeys";

const journeyStepSchema = z.object({
  journeyType: z.string().min(1).max(50),
  step: z.string().min(1).max(50),
  sessionId: z.string().min(1).max(100),
});

// POST /api/analytics/journey - Track journey progress
export async function POST(request: Request) {
  try {
    // Check cookie consent for analytics
    const cookieStore = await cookies();
    const consentCookie = cookieStore.get("cookie-consent");

    if (consentCookie) {
      try {
        const consent = JSON.parse(consentCookie.value);
        if (!consent.analytics) {
          return NextResponse.json({ ok: true, tracked: false });
        }
      } catch {
        return NextResponse.json({ ok: true, tracked: false });
      }
    }

    const session = await auth();
    const userId = session?.user?.id || null;

    const body = await request.json();
    const validated = journeyStepSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const { journeyType, step, sessionId } = validated.data;

    // Validate journey type exists
    const journeyDef = USER_JOURNEYS[journeyType as JourneyType];
    if (!journeyDef) {
      return NextResponse.json({ ok: false, error: "Invalid journey type" }, { status: 400 });
    }

    // Find step index
    const stepIndex = (journeyDef.steps as readonly string[]).indexOf(step);
    if (stepIndex === -1) {
      return NextResponse.json({ ok: false, error: "Invalid step" }, { status: 400 });
    }

    // Try to find existing journey
    const existingJourney = await prisma.userJourney.findUnique({
      where: {
        sessionId_journeyType: {
          sessionId,
          journeyType,
        },
      },
    });

    const now = new Date();

    if (existingJourney) {
      // Update existing journey
      const steps = (existingJourney.steps as Array<{ step: string; completedAt: string }>) || [];
      const existingStepIndex = steps.findIndex((s) => s.step === step);

      if (existingStepIndex === -1) {
        // Add new step
        steps.push({ step, completedAt: now.toISOString() });
      }

      const isComplete = stepIndex === (journeyDef.steps as readonly string[]).length - 1;

      await prisma.userJourney.update({
        where: { id: existingJourney.id },
        data: {
          userId: userId || existingJourney.userId,
          steps,
          currentStep: Math.max(existingJourney.currentStep, stepIndex),
          status: isComplete ? "COMPLETED" : existingJourney.status,
          completedAt: isComplete ? now : existingJourney.completedAt,
        },
      });
    } else {
      // Create new journey
      const isComplete = stepIndex === (journeyDef.steps as readonly string[]).length - 1;

      await prisma.userJourney.create({
        data: {
          userId,
          sessionId,
          journeyType,
          steps: [{ step, completedAt: now.toISOString() }],
          currentStep: stepIndex,
          status: isComplete ? "COMPLETED" : "IN_PROGRESS",
          completedAt: isComplete ? now : null,
        },
      });
    }

    return NextResponse.json({ ok: true, tracked: true });
  } catch (error) {
    logger.error("Journey tracking error", error);
    return NextResponse.json({ ok: true, tracked: false });
  }
}
