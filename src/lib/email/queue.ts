import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { EmailPriority, EmailQueueStatus } from "@prisma/client";
import {
  sendWeeklyDigestEmail,
  sendEventApproachingEmail,
  sendWishlistReminderEmail,
  sendSecretSantaNotification,
  sendMemberJoinedNotification,
  sendBubbleInvitation,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendEmailChangeVerification,
  sendGroupDeletedEmail,
  sendMentionEmail,
} from "./index";

// Email types that can be queued
export type EmailType =
  | "weeklyDigest"
  | "eventApproaching"
  | "wishlistReminder"
  | "secretSanta"
  | "memberJoined"
  | "invitation"
  | "verification"
  | "passwordReset"
  | "emailChange"
  | "groupDeleted"
  | "mention";

// Payload types for each email type
export interface EmailPayloads {
  weeklyDigest: {
    userName: string;
    bubbles: Array<{
      name: string;
      url: string;
      newMembers: number;
      newItems: number;
      upcomingEvent?: string; // ISO date string
    }>;
    locale?: string;
  };
  eventApproaching: {
    userName: string;
    bubbleName: string;
    bubbleUrl: string;
    eventDate: string; // ISO date string
    daysUntil: number;
    locale?: string;
  };
  wishlistReminder: {
    userName: string;
    bubbleName: string;
    bubbleUrl: string;
    eventDate?: string; // ISO date string
    locale?: string;
  };
  secretSanta: {
    receiverName: string;
    bubbleName: string;
    bubbleUrl: string;
    locale?: string;
  };
  memberJoined: {
    memberName: string;
    bubbleName: string;
    bubbleUrl: string;
    locale?: string;
  };
  invitation: {
    inviterName: string;
    bubbleName: string;
    inviteUrl: string;
    locale?: string;
  };
  verification: {
    verificationUrl: string;
    locale?: string;
  };
  passwordReset: {
    resetUrl: string;
    locale?: string;
  };
  emailChange: {
    verificationUrl: string;
    locale?: string;
  };
  groupDeleted: {
    bubbleName: string;
    ownerName: string;
    locale?: string;
  };
  mention: {
    senderName: string;
    bubbleName: string;
    bubbleUrl: string;
    messagePreview: string;
    locale?: string;
  };
}

/**
 * Add an email to the queue for later processing
 */
export async function queueEmail<T extends EmailType>(
  type: T,
  to: string,
  payload: EmailPayloads[T],
  options?: {
    priority?: EmailPriority;
    scheduledFor?: Date;
    maxAttempts?: number;
  }
) {
  try {
    const email = await prisma.emailQueue.create({
      data: {
        type,
        to,
        payload: payload as object,
        priority: options?.priority ?? EmailPriority.NORMAL,
        scheduledFor: options?.scheduledFor ?? new Date(),
        maxAttempts: options?.maxAttempts ?? 3,
      },
    });

    logger.debug("Email queued", { id: email.id, type, to });
    return { success: true, id: email.id };
  } catch (error) {
    logger.error("Failed to queue email", error, { type, to });
    return { success: false, error };
  }
}

/**
 * Queue multiple emails in a batch (more efficient for bulk operations)
 */
export async function queueEmails<T extends EmailType>(
  emails: Array<{
    type: T;
    to: string;
    payload: EmailPayloads[T];
  }>,
  options?: {
    priority?: EmailPriority;
    scheduledFor?: Date;
    maxAttempts?: number;
  }
) {
  try {
    const result = await prisma.emailQueue.createMany({
      data: emails.map((email) => ({
        type: email.type,
        to: email.to,
        payload: email.payload as object,
        priority: options?.priority ?? EmailPriority.NORMAL,
        scheduledFor: options?.scheduledFor ?? new Date(),
        maxAttempts: options?.maxAttempts ?? 3,
      })),
    });

    logger.info("Emails queued in batch", { count: result.count });
    return { success: true, count: result.count };
  } catch (error) {
    logger.error("Failed to queue batch emails", error, { count: emails.length });
    return { success: false, error };
  }
}

/**
 * Send the actual email based on type and payload
 */
async function sendEmailByType(
  type: string,
  to: string,
  payload: Record<string, unknown>
): Promise<{ success: boolean; error?: unknown }> {
  switch (type) {
    case "weeklyDigest": {
      const p = payload as EmailPayloads["weeklyDigest"];
      return sendWeeklyDigestEmail({
        to,
        userName: p.userName,
        bubbles: p.bubbles.map((b) => ({
          ...b,
          upcomingEvent: b.upcomingEvent ? new Date(b.upcomingEvent) : undefined,
        })),
        locale: p.locale,
      });
    }

    case "eventApproaching": {
      const p = payload as EmailPayloads["eventApproaching"];
      return sendEventApproachingEmail({
        to,
        userName: p.userName,
        bubbleName: p.bubbleName,
        bubbleUrl: p.bubbleUrl,
        eventDate: new Date(p.eventDate),
        daysUntil: p.daysUntil,
        locale: p.locale,
      });
    }

    case "wishlistReminder": {
      const p = payload as EmailPayloads["wishlistReminder"];
      return sendWishlistReminderEmail({
        to,
        userName: p.userName,
        bubbleName: p.bubbleName,
        bubbleUrl: p.bubbleUrl,
        eventDate: p.eventDate ? new Date(p.eventDate) : undefined,
        locale: p.locale,
      });
    }

    case "secretSanta": {
      const p = payload as EmailPayloads["secretSanta"];
      return sendSecretSantaNotification({
        to,
        receiverName: p.receiverName,
        bubbleName: p.bubbleName,
        bubbleUrl: p.bubbleUrl,
        locale: p.locale,
      });
    }

    case "memberJoined": {
      const p = payload as EmailPayloads["memberJoined"];
      return sendMemberJoinedNotification({
        to,
        memberName: p.memberName,
        bubbleName: p.bubbleName,
        bubbleUrl: p.bubbleUrl,
        locale: p.locale,
      });
    }

    case "invitation": {
      const p = payload as EmailPayloads["invitation"];
      return sendBubbleInvitation({
        to,
        inviterName: p.inviterName,
        bubbleName: p.bubbleName,
        inviteUrl: p.inviteUrl,
        locale: p.locale,
      });
    }

    case "verification": {
      const p = payload as EmailPayloads["verification"];
      return sendVerificationEmail({
        to,
        verificationUrl: p.verificationUrl,
        locale: p.locale,
      });
    }

    case "passwordReset": {
      const p = payload as EmailPayloads["passwordReset"];
      return sendPasswordResetEmail({
        to,
        resetUrl: p.resetUrl,
        locale: p.locale,
      });
    }

    case "emailChange": {
      const p = payload as EmailPayloads["emailChange"];
      return sendEmailChangeVerification({
        to,
        verificationUrl: p.verificationUrl,
        locale: p.locale,
      });
    }

    case "groupDeleted": {
      const p = payload as EmailPayloads["groupDeleted"];
      return sendGroupDeletedEmail({
        to,
        bubbleName: p.bubbleName,
        ownerName: p.ownerName,
        locale: p.locale,
      });
    }

    case "mention": {
      const p = payload as EmailPayloads["mention"];
      return sendMentionEmail({
        to,
        senderName: p.senderName,
        bubbleName: p.bubbleName,
        bubbleUrl: p.bubbleUrl,
        messagePreview: p.messagePreview,
        locale: p.locale,
      });
    }

    default:
      logger.error("Unknown email type in queue", undefined, { type });
      return { success: false, error: `Unknown email type: ${type}` };
  }
}

/**
 * Helper to delay execution
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Process pending emails from the queue
 * Rate limited to 600ms between sends to respect Resend's 2 req/sec limit
 */
export async function processEmailQueue(batchSize: number = 150): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  const stats = { processed: 0, succeeded: 0, failed: 0 };

  // Fetch pending emails, prioritizing HIGH priority, then by scheduledFor
  const pendingEmails = await prisma.emailQueue.findMany({
    where: {
      status: EmailQueueStatus.PENDING,
      scheduledFor: { lte: new Date() },
      attempts: { lt: prisma.emailQueue.fields.maxAttempts },
    },
    orderBy: [
      { priority: "asc" }, // HIGH (0) before NORMAL (1)
      { scheduledFor: "asc" },
    ],
    take: batchSize,
  });

  if (pendingEmails.length === 0) {
    logger.debug("No pending emails to process");
    return stats;
  }

  logger.info("Processing email queue", { count: pendingEmails.length });

  for (const email of pendingEmails) {
    // Mark as processing
    await prisma.emailQueue.update({
      where: { id: email.id },
      data: {
        status: EmailQueueStatus.PROCESSING,
        attempts: { increment: 1 },
      },
    });

    try {
      const result = await sendEmailByType(
        email.type,
        email.to,
        email.payload as Record<string, unknown>
      );

      if (result.success) {
        // Mark as completed
        await prisma.emailQueue.update({
          where: { id: email.id },
          data: {
            status: EmailQueueStatus.COMPLETED,
            processedAt: new Date(),
          },
        });
        stats.succeeded++;
      } else {
        // Mark as failed or pending for retry
        const newAttempts = email.attempts + 1;
        const isFinalAttempt = newAttempts >= email.maxAttempts;

        await prisma.emailQueue.update({
          where: { id: email.id },
          data: {
            status: isFinalAttempt ? EmailQueueStatus.FAILED : EmailQueueStatus.PENDING,
            lastError: result.error
              ? typeof result.error === "string"
                ? result.error
                : JSON.stringify(result.error)
              : "Unknown error",
            // Exponential backoff for retries: 1min, 4min, 16min
            scheduledFor: isFinalAttempt
              ? undefined
              : new Date(Date.now() + Math.pow(4, newAttempts) * 60 * 1000),
          },
        });
        stats.failed++;
      }
    } catch (error) {
      // Unexpected error - mark for retry
      const newAttempts = email.attempts + 1;
      const isFinalAttempt = newAttempts >= email.maxAttempts;

      await prisma.emailQueue.update({
        where: { id: email.id },
        data: {
          status: isFinalAttempt ? EmailQueueStatus.FAILED : EmailQueueStatus.PENDING,
          lastError: error instanceof Error ? error.message : String(error),
          scheduledFor: isFinalAttempt
            ? undefined
            : new Date(Date.now() + Math.pow(4, newAttempts) * 60 * 1000),
        },
      });
      stats.failed++;
      logger.error("Error processing queued email", error, {
        emailId: email.id,
        type: email.type,
      });
    }

    stats.processed++;

    // Rate limit: 600ms delay between sends
    if (stats.processed < pendingEmails.length) {
      await delay(600);
    }
  }

  logger.info("Email queue processing complete", stats);
  return stats;
}

/**
 * Manually retry a failed email
 */
export async function retryEmail(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const email = await prisma.emailQueue.findUnique({
      where: { id },
    });

    if (!email) {
      return { success: false, error: "Email not found" };
    }

    if (email.status !== EmailQueueStatus.FAILED) {
      return { success: false, error: "Only failed emails can be retried" };
    }

    await prisma.emailQueue.update({
      where: { id },
      data: {
        status: EmailQueueStatus.PENDING,
        attempts: 0,
        scheduledFor: new Date(),
        lastError: null,
      },
    });

    return { success: true };
  } catch (error) {
    logger.error("Failed to retry email", error, { id });
    return { success: false, error: "Database error" };
  }
}

/**
 * Get queue statistics for admin dashboard
 */
export async function getQueueStats() {
  const [pending, processing, completed, failed, recentCompleted, recentFailed] =
    await Promise.all([
      prisma.emailQueue.count({ where: { status: EmailQueueStatus.PENDING } }),
      prisma.emailQueue.count({ where: { status: EmailQueueStatus.PROCESSING } }),
      prisma.emailQueue.count({ where: { status: EmailQueueStatus.COMPLETED } }),
      prisma.emailQueue.count({ where: { status: EmailQueueStatus.FAILED } }),
      // Last 24 hours
      prisma.emailQueue.count({
        where: {
          status: EmailQueueStatus.COMPLETED,
          processedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.emailQueue.count({
        where: {
          status: EmailQueueStatus.FAILED,
          updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

  return {
    pending,
    processing,
    completed,
    failed,
    recentCompleted,
    recentFailed,
  };
}

/**
 * Clean up old completed emails (keep last 7 days)
 */
export async function cleanupOldEmails(): Promise<number> {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const result = await prisma.emailQueue.deleteMany({
    where: {
      status: EmailQueueStatus.COMPLETED,
      processedAt: { lt: cutoff },
    },
  });

  if (result.count > 0) {
    logger.info("Cleaned up old completed emails", { count: result.count });
  }

  return result.count;
}
