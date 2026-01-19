import { prisma } from "@/lib/db";
import { withPrismaRetryAll } from "@/lib/db/prisma-utils";
import { logger } from "@/lib/logger";
import { EmailPriority, EmailQueueStatus, PrismaClient } from "@prisma/client";
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
  sendPaymentFailedEmail,
  sendBubbleAccessAlert,
  sendPriceDropEmail,
  sendOwnerDigestEmail,
  sendContactFormNotification,
  sendContactReply,
  sendAccountSuspendedEmail,
  sendAccountTerminatedEmail,
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
  | "mention"
  | "paymentFailed"
  | "bubbleAccessAlert"
  | "priceDrop"
  | "ownerDigest"
  | "contactForm"
  | "contactReply"
  | "accountSuspended"
  | "accountTerminated";

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
  paymentFailed: {
    userName: string;
    amount: string;
    currency: string;
    nextRetryDate?: string; // ISO date string
    billingUrl: string;
    locale?: string;
  };
  bubbleAccessAlert: {
    bubbleName: string;
    deviceName: string;
    ipAddress: string;
    accessTime: string;
    locale?: string;
  };
  priceDrop: {
    itemTitle: string;
    itemUrl: string | null;
    wishlistUrl: string;
    oldPrice: string;
    newPrice: string;
    currency: string;
    percentOff: number;
    locale?: string;
  };
  ownerDigest: {
    period: "daily" | "weekly";
    periodLabel: string;
    health: {
      system: { level: "healthy" | "warning" | "critical"; label: string };
      email: { level: "healthy" | "warning" | "critical"; label: string; failedCount: number };
      contacts: { level: "healthy" | "warning" | "critical"; unansweredCount: number };
    };
    growth: {
      users: { total: number; change: number };
      bubbles: { total: number; change: number };
      items: { total: number; change: number };
      claims: { total: number; change: number };
    };
    business: {
      mrr: string;
      mrrCents: number;
      activeSubscriptions: number;
      conversionRate: number;
    };
    highlights: string[];
    hasActivity: boolean;
  };
  contactForm: {
    senderName: string;
    senderEmail: string;
    subject: string;
    message: string;
    adminUrl: string;
  };
  contactReply: {
    senderName: string;
    subject: string;
    originalMessage: string;
    replyMessage: string;
    replyFrom: string;
    locale?: string;
  };
  accountSuspended: {
    reason: string;
    suspendedUntil: string | null; // ISO date string
    locale?: string;
  };
  accountTerminated: {
    reason: string;
    hadSubscription: boolean;
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

    case "paymentFailed": {
      const p = payload as EmailPayloads["paymentFailed"];
      return sendPaymentFailedEmail({
        to,
        userName: p.userName,
        amount: p.amount,
        currency: p.currency,
        nextRetryDate: p.nextRetryDate ? new Date(p.nextRetryDate) : undefined,
        billingUrl: p.billingUrl,
        locale: p.locale,
      });
    }

    case "bubbleAccessAlert": {
      const p = payload as EmailPayloads["bubbleAccessAlert"];
      return sendBubbleAccessAlert({
        to,
        bubbleName: p.bubbleName,
        deviceName: p.deviceName,
        ipAddress: p.ipAddress,
        accessTime: p.accessTime,
        locale: p.locale,
      });
    }

    case "priceDrop": {
      const p = payload as EmailPayloads["priceDrop"];
      return sendPriceDropEmail({
        to,
        itemTitle: p.itemTitle,
        itemUrl: p.itemUrl,
        wishlistUrl: p.wishlistUrl,
        oldPrice: p.oldPrice,
        newPrice: p.newPrice,
        currency: p.currency,
        percentOff: p.percentOff,
        locale: p.locale,
      });
    }

    case "ownerDigest": {
      const p = payload as EmailPayloads["ownerDigest"];
      return sendOwnerDigestEmail({
        to,
        data: {
          period: p.period,
          periodLabel: p.periodLabel,
          health: p.health,
          growth: p.growth,
          business: p.business,
          highlights: p.highlights,
          hasActivity: p.hasActivity,
        },
      });
    }

    case "contactForm": {
      const p = payload as EmailPayloads["contactForm"];
      return sendContactFormNotification({
        to,
        senderName: p.senderName,
        senderEmail: p.senderEmail,
        subject: p.subject,
        message: p.message,
        adminUrl: p.adminUrl,
      });
    }

    case "contactReply": {
      const p = payload as EmailPayloads["contactReply"];
      return sendContactReply({
        to,
        senderName: p.senderName,
        subject: p.subject,
        originalMessage: p.originalMessage,
        replyMessage: p.replyMessage,
        replyFrom: p.replyFrom,
        locale: p.locale,
      });
    }

    case "accountSuspended": {
      const p = payload as EmailPayloads["accountSuspended"];
      return sendAccountSuspendedEmail({
        to,
        reason: p.reason,
        suspendedUntil: p.suspendedUntil ? new Date(p.suspendedUntil) : null,
        locale: p.locale,
      });
    }

    case "accountTerminated": {
      const p = payload as EmailPayloads["accountTerminated"];
      return sendAccountTerminatedEmail({
        to,
        reason: p.reason,
        hadSubscription: p.hadSubscription,
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
 *
 * @param batchSize - Maximum number of emails to process in this batch
 * @param db - Optional Prisma client to use (defaults to global prisma with Accelerate)
 *             Pass a direct client for cron jobs to bypass Accelerate and avoid transient errors
 */
export async function processEmailQueue(
  batchSize: number = 150,
  db: PrismaClient = prisma
): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  const stats = { processed: 0, succeeded: 0, failed: 0 };

  // Fetch pending emails, prioritizing HIGH priority, then by scheduledFor
  // Note: We use a raw comparison for attempts < maxAttempts since Prisma doesn't
  // support cross-column comparisons directly
  const pendingEmails = await db.emailQueue.findMany({
    where: {
      status: EmailQueueStatus.PENDING,
      scheduledFor: { lte: new Date() },
    },
    orderBy: [
      { priority: "asc" }, // HIGH (0) before NORMAL (1)
      { scheduledFor: "asc" },
    ],
    take: batchSize,
  });

  // Filter to only include emails that haven't exceeded max attempts
  // (Done in code since Prisma doesn't support cross-column comparisons)
  const eligibleEmails = pendingEmails.filter(
    (email) => email.attempts < email.maxAttempts
  );

  if (eligibleEmails.length === 0) {
    logger.debug("No pending emails to process");
    return stats;
  }

  logger.info("Processing email queue", { count: eligibleEmails.length });

  for (const email of eligibleEmails) {
    // Mark as processing
    await db.emailQueue.update({
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
        await db.emailQueue.update({
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

        await db.emailQueue.update({
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

      await db.emailQueue.update({
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
    if (stats.processed < eligibleEmails.length) {
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
    await withPrismaRetryAll(
      [
        () =>
          prisma.emailQueue.count({ where: { status: EmailQueueStatus.PENDING } }),
        () =>
          prisma.emailQueue.count({
            where: { status: EmailQueueStatus.PROCESSING },
          }),
        () =>
          prisma.emailQueue.count({ where: { status: EmailQueueStatus.COMPLETED } }),
        () =>
          prisma.emailQueue.count({ where: { status: EmailQueueStatus.FAILED } }),
        // Last 24 hours
        () =>
          prisma.emailQueue.count({
            where: {
              status: EmailQueueStatus.COMPLETED,
              processedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            },
          }),
        () =>
          prisma.emailQueue.count({
            where: {
              status: EmailQueueStatus.FAILED,
              updatedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            },
          }),
      ],
      { context: "getQueueStats" }
    );

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

/**
 * Process a single email by ID immediately (used for time-sensitive emails)
 * This processes just the specified email without rate limiting delays
 */
export async function processEmailById(
  id: string,
  db: PrismaClient = prisma
): Promise<{ success: boolean; error?: string }> {
  const email = await db.emailQueue.findUnique({
    where: { id },
  });

  if (!email) {
    return { success: false, error: "Email not found" };
  }

  if (email.status !== EmailQueueStatus.PENDING) {
    // Already processing or completed
    return { success: true };
  }

  // Mark as processing
  await db.emailQueue.update({
    where: { id },
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
      await db.emailQueue.update({
        where: { id },
        data: {
          status: EmailQueueStatus.COMPLETED,
          processedAt: new Date(),
        },
      });
      logger.debug("Email sent immediately", { id, type: email.type, to: email.to });
      return { success: true };
    } else {
      // Mark for retry
      const newAttempts = email.attempts + 1;
      const isFinalAttempt = newAttempts >= email.maxAttempts;

      await db.emailQueue.update({
        where: { id },
        data: {
          status: isFinalAttempt ? EmailQueueStatus.FAILED : EmailQueueStatus.PENDING,
          lastError: result.error
            ? typeof result.error === "string"
              ? result.error
              : JSON.stringify(result.error)
            : "Unknown error",
          scheduledFor: isFinalAttempt
            ? undefined
            : new Date(Date.now() + Math.pow(4, newAttempts) * 60 * 1000),
        },
      });
      return {
        success: false,
        error: result.error ? String(result.error) : "Send failed",
      };
    }
  } catch (error) {
    const newAttempts = email.attempts + 1;
    const isFinalAttempt = newAttempts >= email.maxAttempts;

    await db.emailQueue.update({
      where: { id },
      data: {
        status: isFinalAttempt ? EmailQueueStatus.FAILED : EmailQueueStatus.PENDING,
        lastError: error instanceof Error ? error.message : String(error),
        scheduledFor: isFinalAttempt
          ? undefined
          : new Date(Date.now() + Math.pow(4, newAttempts) * 60 * 1000),
      },
    });

    logger.error("Error processing email immediately", error, {
      emailId: id,
      type: email.type,
    });
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Queue an email and process it immediately (for time-sensitive emails)
 * This ensures the email appears in queue stats while still being sent right away.
 * If immediate send fails, the email remains in queue for retry by the cron job.
 */
export async function queueEmailAndProcessImmediately<T extends EmailType>(
  type: T,
  to: string,
  payload: EmailPayloads[T],
  options?: {
    maxAttempts?: number;
  }
): Promise<{ success: boolean; id?: string; error?: unknown }> {
  // Queue with HIGH priority so if immediate send fails, it gets picked up first
  const queueResult = await queueEmail(type, to, payload, {
    priority: EmailPriority.HIGH,
    scheduledFor: new Date(),
    maxAttempts: options?.maxAttempts ?? 3,
  });

  if (!queueResult.success || !queueResult.id) {
    return queueResult;
  }

  // Process immediately
  const processResult = await processEmailById(queueResult.id);

  // Return success even if immediate processing failed - the email is queued for retry
  return {
    success: true,
    id: queueResult.id,
    error: processResult.success ? undefined : processResult.error,
  };
}

// ============================================================================
// Queue-based email sending functions (wrappers around direct send functions)
// These ensure all emails go through the queue for tracking while still
// being sent immediately for time-sensitive emails.
// ============================================================================

/**
 * Queue and send verification email immediately
 */
export async function queueVerificationEmail(params: {
  to: string;
  verificationUrl: string;
  locale?: string;
}): Promise<{ success: boolean; error?: unknown }> {
  return queueEmailAndProcessImmediately("verification", params.to, {
    verificationUrl: params.verificationUrl,
    locale: params.locale,
  });
}

/**
 * Queue and send password reset email immediately
 */
export async function queuePasswordResetEmail(params: {
  to: string;
  resetUrl: string;
  locale?: string;
}): Promise<{ success: boolean; error?: unknown }> {
  return queueEmailAndProcessImmediately("passwordReset", params.to, {
    resetUrl: params.resetUrl,
    locale: params.locale,
  });
}

/**
 * Queue and send bubble invitation email immediately
 */
export async function queueBubbleInvitation(params: {
  to: string;
  inviterName: string;
  bubbleName: string;
  inviteUrl: string;
  locale?: string;
}): Promise<{ success: boolean; error?: unknown }> {
  return queueEmailAndProcessImmediately("invitation", params.to, {
    inviterName: params.inviterName,
    bubbleName: params.bubbleName,
    inviteUrl: params.inviteUrl,
    locale: params.locale,
  });
}

/**
 * Queue and send email change verification immediately
 */
export async function queueEmailChangeVerification(params: {
  to: string;
  verificationUrl: string;
  locale?: string;
}): Promise<{ success: boolean; error?: unknown }> {
  return queueEmailAndProcessImmediately("emailChange", params.to, {
    verificationUrl: params.verificationUrl,
    locale: params.locale,
  });
}

/**
 * Queue and send member joined notification immediately
 */
export async function queueMemberJoinedNotification(params: {
  to: string;
  memberName: string;
  bubbleName: string;
  bubbleUrl: string;
  locale?: string;
}): Promise<{ success: boolean; error?: unknown }> {
  return queueEmailAndProcessImmediately("memberJoined", params.to, {
    memberName: params.memberName,
    bubbleName: params.bubbleName,
    bubbleUrl: params.bubbleUrl,
    locale: params.locale,
  });
}

/**
 * Queue and send Secret Santa notification immediately
 */
export async function queueSecretSantaNotification(params: {
  to: string;
  receiverName: string;
  bubbleName: string;
  bubbleUrl: string;
  locale?: string;
}): Promise<{ success: boolean; error?: unknown }> {
  return queueEmailAndProcessImmediately("secretSanta", params.to, {
    receiverName: params.receiverName,
    bubbleName: params.bubbleName,
    bubbleUrl: params.bubbleUrl,
    locale: params.locale,
  });
}

/**
 * Queue and send wishlist reminder email immediately
 */
export async function queueWishlistReminderEmail(params: {
  to: string;
  userName: string;
  bubbleName: string;
  bubbleUrl: string;
  eventDate?: Date;
  locale?: string;
}): Promise<{ success: boolean; error?: unknown }> {
  return queueEmailAndProcessImmediately("wishlistReminder", params.to, {
    userName: params.userName,
    bubbleName: params.bubbleName,
    bubbleUrl: params.bubbleUrl,
    eventDate: params.eventDate?.toISOString(),
    locale: params.locale,
  });
}

/**
 * Queue and send event approaching email immediately
 */
export async function queueEventApproachingEmail(params: {
  to: string;
  userName: string;
  bubbleName: string;
  bubbleUrl: string;
  eventDate: Date;
  daysUntil: number;
  locale?: string;
}): Promise<{ success: boolean; error?: unknown }> {
  return queueEmailAndProcessImmediately("eventApproaching", params.to, {
    userName: params.userName,
    bubbleName: params.bubbleName,
    bubbleUrl: params.bubbleUrl,
    eventDate: params.eventDate.toISOString(),
    daysUntil: params.daysUntil,
    locale: params.locale,
  });
}

/**
 * Queue and send weekly digest email immediately
 */
export async function queueWeeklyDigestEmail(params: {
  to: string;
  userName: string;
  bubbles: Array<{
    name: string;
    url: string;
    newMembers: number;
    newItems: number;
    upcomingEvent?: Date;
  }>;
  locale?: string;
}): Promise<{ success: boolean; error?: unknown }> {
  return queueEmailAndProcessImmediately("weeklyDigest", params.to, {
    userName: params.userName,
    bubbles: params.bubbles.map((b) => ({
      name: b.name,
      url: b.url,
      newMembers: b.newMembers,
      newItems: b.newItems,
      upcomingEvent: b.upcomingEvent?.toISOString(),
    })),
    locale: params.locale,
  });
}

/**
 * Queue and send group deleted email immediately
 */
export async function queueGroupDeletedEmail(params: {
  to: string;
  bubbleName: string;
  ownerName: string;
  locale?: string;
}): Promise<{ success: boolean; error?: unknown }> {
  return queueEmailAndProcessImmediately("groupDeleted", params.to, {
    bubbleName: params.bubbleName,
    ownerName: params.ownerName,
    locale: params.locale,
  });
}

/**
 * Queue and send mention email immediately
 */
export async function queueMentionEmail(params: {
  to: string;
  senderName: string;
  bubbleName: string;
  bubbleUrl: string;
  messagePreview: string;
  locale?: string;
}): Promise<{ success: boolean; error?: unknown }> {
  return queueEmailAndProcessImmediately("mention", params.to, {
    senderName: params.senderName,
    bubbleName: params.bubbleName,
    bubbleUrl: params.bubbleUrl,
    messagePreview: params.messagePreview,
    locale: params.locale,
  });
}

/**
 * Queue and send bubble access alert email immediately
 */
export async function queueBubbleAccessAlert(params: {
  to: string;
  bubbleName: string;
  deviceName: string;
  ipAddress: string;
  accessTime: string;
  locale?: string;
}): Promise<{ success: boolean; error?: unknown }> {
  return queueEmailAndProcessImmediately("bubbleAccessAlert", params.to, {
    bubbleName: params.bubbleName,
    deviceName: params.deviceName,
    ipAddress: params.ipAddress,
    accessTime: params.accessTime,
    locale: params.locale,
  });
}

/**
 * Queue and send price drop alert email immediately
 */
export async function queuePriceDropEmail(params: {
  to: string;
  itemTitle: string;
  itemUrl: string | null;
  wishlistUrl: string;
  oldPrice: string;
  newPrice: string;
  currency: string;
  percentOff: number;
  locale?: string;
}): Promise<{ success: boolean; error?: unknown }> {
  return queueEmailAndProcessImmediately("priceDrop", params.to, {
    itemTitle: params.itemTitle,
    itemUrl: params.itemUrl,
    wishlistUrl: params.wishlistUrl,
    oldPrice: params.oldPrice,
    newPrice: params.newPrice,
    currency: params.currency,
    percentOff: params.percentOff,
    locale: params.locale,
  });
}

/**
 * Queue owner digest email
 * Unlike other emails, this is queued but not processed immediately
 * to maintain visibility in the email queue admin panel
 */
export async function queueOwnerDigestEmail(params: {
  to: string;
  data: EmailPayloads["ownerDigest"];
}): Promise<{ success: boolean; id?: string; error?: unknown }> {
  return queueEmail("ownerDigest", params.to, params.data, {
    priority: "HIGH",
  });
}

/**
 * Queue and send contact form notification email immediately
 */
export async function queueContactFormNotification(params: {
  to: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  message: string;
  adminUrl: string;
}): Promise<{ success: boolean; error?: unknown }> {
  return queueEmailAndProcessImmediately("contactForm", params.to, {
    senderName: params.senderName,
    senderEmail: params.senderEmail,
    subject: params.subject,
    message: params.message,
    adminUrl: params.adminUrl,
  });
}

/**
 * Queue and send contact reply email immediately
 */
export async function queueContactReply(params: {
  to: string;
  senderName: string;
  subject: string;
  originalMessage: string;
  replyMessage: string;
  replyFrom: string;
  locale?: string;
}): Promise<{ success: boolean; error?: unknown }> {
  return queueEmailAndProcessImmediately("contactReply", params.to, {
    senderName: params.senderName,
    subject: params.subject,
    originalMessage: params.originalMessage,
    replyMessage: params.replyMessage,
    replyFrom: params.replyFrom,
    locale: params.locale,
  });
}

/**
 * Queue and send account suspended email immediately
 */
export async function queueAccountSuspendedEmail(params: {
  to: string;
  reason: string;
  suspendedUntil: Date | null;
  locale?: string;
}): Promise<{ success: boolean; error?: unknown }> {
  return queueEmailAndProcessImmediately("accountSuspended", params.to, {
    reason: params.reason,
    suspendedUntil: params.suspendedUntil?.toISOString() ?? null,
    locale: params.locale,
  });
}

/**
 * Queue and send account terminated email immediately
 */
export async function queueAccountTerminatedEmail(params: {
  to: string;
  reason: string;
  hadSubscription: boolean;
  locale?: string;
}): Promise<{ success: boolean; error?: unknown }> {
  return queueEmailAndProcessImmediately("accountTerminated", params.to, {
    reason: params.reason,
    hadSubscription: params.hadSubscription,
    locale: params.locale,
  });
}
