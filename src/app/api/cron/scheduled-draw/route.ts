import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { queueEmail } from "@/lib/email/queue";
import { createLocalizedNotification } from "@/lib/notifications";
import { logger } from "@/lib/logger";
import * as Sentry from "@sentry/nextjs";

// This endpoint should be called by a cron job (e.g., Vercel Cron) every hour
// It checks for scheduled Secret Santa draws that are due and executes them

export async function GET(request: Request) {
  const checkInId = Sentry.captureCheckIn(
    {
      monitorSlug: "scheduled-draw",
      status: "in_progress",
    },
    {
      schedule: { type: "crontab", value: "0 * * * *" },
      maxRuntime: 5,
      timezone: "Etc/UTC",
    }
  );

  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      logger.warn("Unauthorized cron access attempt", { cron: "scheduled-draw" });
      Sentry.captureCheckIn({
        checkInId,
        monitorSlug: "scheduled-draw",
        status: "error",
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // Find bubbles with scheduled draws that are due (draw date has passed but not yet drawn)
    const bubblesDue = await prisma.bubble.findMany({
      where: {
        archivedAt: null,
        isSecretSanta: true,
        secretSantaDrawn: false,
        secretSantaDrawDate: {
          not: null,
          lte: now,
        },
      },
      include: {
        members: {
          where: { leftAt: null },
          include: {
            user: {
              select: { id: true, name: true, email: true, locale: true },
            },
          },
        },
      },
    });

    let drawsExecuted = 0;
    let drawsFailed = 0;

    for (const bubble of bubblesDue) {
      // Need at least 3 members for a proper draw
      if (bubble.members.length < 3) {
        logger.warn("Scheduled draw skipped: not enough members", {
          bubbleId: bubble.id,
          memberCount: bubble.members.length,
        });
        continue;
      }

      try {
        // Get exclusion rules
        const exclusions = await prisma.secretSantaExclusion.findMany({
          where: { bubbleId: bubble.id },
        });

        // Build exclusion map
        const exclusionMap = new Map<string, Set<string>>();
        for (const ex of exclusions) {
          if (!exclusionMap.has(ex.userId1)) {
            exclusionMap.set(ex.userId1, new Set());
          }
          if (!exclusionMap.has(ex.userId2)) {
            exclusionMap.set(ex.userId2, new Set());
          }
          exclusionMap.get(ex.userId1)!.add(ex.userId2);
          exclusionMap.get(ex.userId2)!.add(ex.userId1);
        }

        // Perform the draw
        const members = bubble.members.map((m) => m.user);
        const assignments = performDraw(members, exclusionMap);

        if (!assignments) {
          logger.error("Scheduled draw failed: no valid assignments", {
            bubbleId: bubble.id,
          });
          drawsFailed++;
          continue;
        }

        // Save assignments and mark as drawn
        await prisma.$transaction([
          // Create draw records
          ...assignments.map(({ giverId, receiverId }) =>
            prisma.secretSantaDraw.create({
              data: {
                bubbleId: bubble.id,
                giverId,
                receiverId,
                excludedUserIds: Array.from(exclusionMap.get(giverId) || []),
              },
            })
          ),
          // Mark bubble as drawn and clear the scheduled date
          prisma.bubble.update({
            where: { id: bubble.id },
            data: {
              secretSantaDrawn: true,
              secretSantaDrawDate: null,
            },
          }),
          // Create activity
          prisma.activity.create({
            data: {
              bubbleId: bubble.id,
              userId: bubble.ownerId,
              type: "SECRET_SANTA_DRAWN",
              metadata: {
                automated: true,
                scheduledDraw: true,
              },
            },
          }),
        ]);

        // Queue email and create in-app notifications
        const baseUrl = process.env.NEXTAUTH_URL || "https://wishbubble.app";
        for (const { giverId, receiverId } of assignments) {
          const giver = members.find((m) => m.id === giverId);
          const receiver = members.find((m) => m.id === receiverId);

          if (giver?.email && receiver) {
            const result = await queueEmail("secretSanta", giver.email, {
              receiverName: receiver.name || "Someone",
              bubbleName: bubble.name,
              bubbleUrl: `${baseUrl}/bubbles/${bubble.id}/secret-santa`,
              locale: giver.locale,
            });

            if (!result.success) {
              logger.error(`Failed to queue scheduled draw email to ${giver.email}`, result.error);
            }
          }

          // Create in-app notification
          await createLocalizedNotification(giverId, {
            type: "SECRET_SANTA_DRAWN",
            messageType: "secretSantaDrawn",
            messageParams: {
              bubbleName: bubble.name,
            },
            bubbleId: bubble.id,
          });
        }

        drawsExecuted++;
        logger.info("Scheduled draw executed successfully", {
          bubbleId: bubble.id,
          assignmentCount: assignments.length,
        });
      } catch (error) {
        logger.error("Error executing scheduled draw", error, {
          bubbleId: bubble.id,
        });
        drawsFailed++;
      }
    }

    logger.info("Scheduled draw cron completed", {
      bubblesChecked: bubblesDue.length,
      drawsExecuted,
      drawsFailed,
    });

    Sentry.captureCheckIn({
      checkInId,
      monitorSlug: "scheduled-draw",
      status: "ok",
    });

    // Flush Sentry events before serverless function terminates
    await Sentry.flush(2000);

    return NextResponse.json({
      success: true,
      bubblesChecked: bubblesDue.length,
      drawsExecuted,
      drawsFailed,
    });
  } catch (error) {
    logger.error("Error processing scheduled draws", error);

    Sentry.captureCheckIn({
      checkInId,
      monitorSlug: "scheduled-draw",
      status: "error",
    });

    // Flush Sentry events before serverless function terminates
    await Sentry.flush(2000);

    return NextResponse.json(
      { error: "Failed to process scheduled draws" },
      { status: 500 }
    );
  }
}

// Fisher-Yates shuffle with derangement (no one gets themselves)
// Also respects exclusion rules
function performDraw(
  members: { id: string; name: string | null; email: string; locale: string }[],
  exclusionMap: Map<string, Set<string>>,
  maxAttempts = 1000
): { giverId: string; receiverId: string }[] | null {
  const memberIds = members.map((m) => m.id);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const receivers = [...memberIds];
    shuffleArray(receivers);

    let valid = true;
    const assignments: { giverId: string; receiverId: string }[] = [];

    for (let i = 0; i < memberIds.length; i++) {
      const giverId = memberIds[i];
      const receiverId = receivers[i];

      // Can't give to yourself
      if (giverId === receiverId) {
        valid = false;
        break;
      }

      // Check exclusion rules
      const exclusions = exclusionMap.get(giverId);
      if (exclusions?.has(receiverId)) {
        valid = false;
        break;
      }

      assignments.push({ giverId, receiverId });
    }

    if (valid) {
      return assignments;
    }
  }

  return null;
}

function shuffleArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}
