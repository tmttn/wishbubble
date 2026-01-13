import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NotificationType as PrismaNotificationType } from "@prisma/client";
import {
  createLocalizedNotification,
} from "@/lib/notifications";
import type { NotificationMessageType } from "@/lib/i18n-server";
import {
  queueBubbleInvitation,
  queueVerificationEmail,
  queuePasswordResetEmail,
  queueMemberJoinedNotification,
  queueSecretSantaNotification,
  queueWishlistReminderEmail,
  queueEventApproachingEmail,
  queueWeeklyDigestEmail,
  queueGroupDeletedEmail,
  queueBubbleAccessAlert,
  queueMentionEmail,
} from "@/lib/email/queue";
import { logger } from "@/lib/logger";

// Notification types that can be tested
const notificationTypes = [
  "itemClaimed",
  "wishlistReminder",
  "wishlistShared",
  "bubbleInvitation",
  "secretSantaDrawn",
  "eventApproaching",
  "memberJoined",
  "bubbleDeleted",
  "eventCompleted",
  "weeklyDigest",
  "bubbleAccessed",
  "bubbleMention",
  "priceDrop",
] as const;

// Email types that can be tested
const emailTypes = [
  "invitation",
  "verification",
  "passwordReset",
  "memberJoined",
  "secretSanta",
  "wishlistReminder",
  "eventApproaching",
  "weeklyDigest",
  "groupDeleted",
  "bubbleAccessAlert",
  "mention",
] as const;

type NotificationType = (typeof notificationTypes)[number];
type EmailType = (typeof emailTypes)[number];

// POST /api/admin/notifications/test - Send a test notification or email
export async function POST(request: Request) {
  const adminResult = await requireAdminApi();
  if (adminResult.error) {
    return NextResponse.json(
      { error: adminResult.error },
      { status: adminResult.status }
    );
  }

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, channel, locale } = body as {
      type: NotificationType | EmailType;
      channel: "notification" | "email" | "both";
      locale: string;
    };

    // Get admin user info
    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, name: true, locale: true },
    });

    if (!adminUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userLocale = locale || adminUser.locale || "en";
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://wish-bubble.app";
    const results: { notification?: boolean; email?: boolean; errors?: string[] } = {};
    const errors: string[] = [];

    // Test in-app notification
    if (channel === "notification" || channel === "both") {
      try {
        const messageParams = getNotificationParams(type);
        await createLocalizedNotification(session.user.id, {
          type: mapToNotificationType(type),
          messageType: type as NotificationMessageType,
          messageParams,
          data: { isTest: true },
        });
        results.notification = true;
      } catch (error) {
        logger.error("Test notification failed", error);
        errors.push(`Notification: ${error instanceof Error ? error.message : "Unknown error"}`);
        results.notification = false;
      }
    }

    // Test email
    if (channel === "email" || channel === "both") {
      // Map notification type to email type when using "both" channel
      const emailType = channel === "both" ? mapNotificationToEmailType(type) : type;

      if (channel === "both" && !emailType) {
        // This notification type doesn't have a corresponding email - skip
        results.email = undefined;
      } else {
        try {
          await sendTestEmail((emailType || type) as EmailType, {
            to: adminUser.email,
            name: adminUser.name || "Test User",
            locale: userLocale,
            baseUrl,
          });
          results.email = true;
        } catch (error) {
          logger.error("Test email failed", error);
          errors.push(`Email: ${error instanceof Error ? error.message : "Unknown error"}`);
          results.email = false;
        }
      }
    }

    if (errors.length > 0) {
      results.errors = errors;
    }

    return NextResponse.json({
      success: !errors.length,
      results,
      sentTo: adminUser.email,
      locale: userLocale,
    });
  } catch (error) {
    logger.error("Error in test notification endpoint", error);
    return NextResponse.json(
      { error: "Failed to send test notification" },
      { status: 500 }
    );
  }
}

// GET /api/admin/notifications/test - Get available notification/email types
export async function GET() {
  const adminResult = await requireAdminApi();
  if (adminResult.error) {
    return NextResponse.json(
      { error: adminResult.error },
      { status: adminResult.status }
    );
  }

  return NextResponse.json({
    notificationTypes: notificationTypes.map((type) => ({
      id: type,
      label: formatLabel(type),
      description: getTypeDescription(type),
    })),
    emailTypes: emailTypes.map((type) => ({
      id: type,
      label: formatLabel(type),
      description: getEmailDescription(type),
    })),
  });
}

function formatLabel(type: string): string {
  return type
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

function getTypeDescription(type: NotificationType): string {
  const descriptions: Record<NotificationType, string> = {
    itemClaimed: "When someone claims an item from a wishlist",
    wishlistReminder: "Reminder to add wishlist to a group",
    wishlistShared: "When someone shares their wishlist",
    bubbleInvitation: "Invitation to join a group",
    secretSantaDrawn: "Secret Santa names have been drawn",
    eventApproaching: "Reminder that an event is coming up",
    memberJoined: "When a new member joins a group",
    bubbleDeleted: "When a group is deleted",
    eventCompleted: "When an event has ended",
    weeklyDigest: "Weekly summary of activity",
    bubbleAccessed: "When a Secret Santa bubble is accessed from a new device",
    bubbleMention: "When someone mentions you in a group chat",
    priceDrop: "When price drops on a wishlist item with alerts enabled",
  };
  return descriptions[type] || type;
}

function getEmailDescription(type: EmailType): string {
  const descriptions: Record<EmailType, string> = {
    invitation: "Invite someone to join a group",
    verification: "Verify email address after registration",
    passwordReset: "Password reset request",
    memberJoined: "Notify group members about new member",
    secretSanta: "Secret Santa assignment notification",
    wishlistReminder: "Remind user to add their wishlist",
    eventApproaching: "Event coming up reminder",
    weeklyDigest: "Weekly activity summary",
    groupDeleted: "Group has been deleted notification",
    bubbleAccessAlert: "Security alert when Secret Santa bubble accessed from new device",
    mention: "Email notification when someone mentions you in a chat",
  };
  return descriptions[type] || type;
}

function getNotificationParams(type: string): Record<string, string | number> {
  const params: Record<string, Record<string, string | number>> = {
    itemClaimed: { name: "Test User", itemTitle: "Test Gift", bubbleName: "Test Group" },
    wishlistReminder: { bubbleName: "Test Group" },
    wishlistShared: { name: "Test User", bubbleName: "Test Group" },
    bubbleInvitation: { name: "Test Inviter", bubbleName: "Test Group" },
    secretSantaDrawn: { bubbleName: "Test Group" },
    eventApproaching: { bubbleName: "Test Group", urgency: "coming up soon" },
    memberJoined: { name: "Test User", bubbleName: "Test Group" },
    bubbleDeleted: { bubbleName: "Test Group", name: "The owner" },
    eventCompleted: { bubbleName: "Test Group", giftCount: 5 },
    weeklyDigest: { updateCount: 3, bubbleCount: 2 },
    bubbleAccessed: { bubbleName: "Test Secret Santa Group", deviceName: "Chrome on Windows" },
    bubbleMention: { senderName: "Test User", bubbleName: "Test Group", messagePreview: "Hey @you, check this out!" },
    priceDrop: { itemTitle: "Test Gift", oldPrice: "49.99", newPrice: "29.99", percentOff: 40 },
  };
  return params[type] || {};
}

function mapToNotificationType(type: string): PrismaNotificationType {
  const mapping: Record<string, PrismaNotificationType> = {
    itemClaimed: "ITEM_CLAIMED",
    wishlistReminder: "REMINDER_ADD_WISHLIST",
    wishlistShared: "WISHLIST_ADDED",
    bubbleInvitation: "BUBBLE_INVITATION",
    secretSantaDrawn: "SECRET_SANTA_DRAWN",
    eventApproaching: "EVENT_APPROACHING",
    memberJoined: "MEMBER_JOINED",
    bubbleDeleted: "GROUP_DELETED",
    eventCompleted: "EVENT_COMPLETED",
    weeklyDigest: "WEEKLY_DIGEST",
    bubbleAccessed: "BUBBLE_ACCESSED",
    bubbleMention: "BUBBLE_MESSAGE",
    priceDrop: "PRICE_DROP",
  };
  return mapping[type] || "SYSTEM";
}

// Map notification types to their corresponding email types
function mapNotificationToEmailType(type: string): string | null {
  const mapping: Record<string, string> = {
    bubbleInvitation: "invitation",
    secretSantaDrawn: "secretSanta",
    bubbleDeleted: "groupDeleted",
    bubbleAccessed: "bubbleAccessAlert",
    bubbleMention: "mention",
    // These have the same name in both lists:
    wishlistReminder: "wishlistReminder",
    eventApproaching: "eventApproaching",
    memberJoined: "memberJoined",
    weeklyDigest: "weeklyDigest",
  };
  return mapping[type] || null;
}

async function sendTestEmail(
  type: EmailType,
  params: { to: string; name: string; locale: string; baseUrl: string }
): Promise<void> {
  const { to, name, locale, baseUrl } = params;

  switch (type) {
    case "invitation":
      await queueBubbleInvitation({
        to,
        inviterName: "Test Inviter",
        bubbleName: "Test Group",
        inviteUrl: `${baseUrl}/invite/test-token`,
        locale,
      });
      break;

    case "verification":
      await queueVerificationEmail({
        to,
        verificationUrl: `${baseUrl}/verify-email?token=test-token`,
        locale,
      });
      break;

    case "passwordReset":
      await queuePasswordResetEmail({
        to,
        resetUrl: `${baseUrl}/reset-password?token=test-token`,
        locale,
      });
      break;

    case "memberJoined":
      await queueMemberJoinedNotification({
        to,
        memberName: "New Test Member",
        bubbleName: "Test Group",
        bubbleUrl: `${baseUrl}/bubbles/test-id`,
        locale,
      });
      break;

    case "secretSanta":
      await queueSecretSantaNotification({
        to,
        receiverName: "Secret Recipient",
        bubbleName: "Test Group",
        bubbleUrl: `${baseUrl}/bubbles/test-id/secret-santa`,
        locale,
      });
      break;

    case "wishlistReminder":
      await queueWishlistReminderEmail({
        to,
        userName: name,
        bubbleName: "Test Group",
        bubbleUrl: `${baseUrl}/bubbles/test-id`,
        eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        locale,
      });
      break;

    case "eventApproaching":
      await queueEventApproachingEmail({
        to,
        userName: name,
        bubbleName: "Test Group",
        bubbleUrl: `${baseUrl}/bubbles/test-id`,
        eventDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        daysUntil: 3,
        locale,
      });
      break;

    case "weeklyDigest":
      await queueWeeklyDigestEmail({
        to,
        userName: name,
        bubbles: [
          {
            name: "Test Group 1",
            url: `${baseUrl}/bubbles/test-1`,
            newMembers: 2,
            newItems: 5,
            upcomingEvent: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          },
          {
            name: "Test Group 2",
            url: `${baseUrl}/bubbles/test-2`,
            newMembers: 0,
            newItems: 3,
            upcomingEvent: undefined,
          },
        ],
        locale,
      });
      break;

    case "groupDeleted":
      await queueGroupDeletedEmail({
        to,
        bubbleName: "Test Group",
        ownerName: "Group Owner",
        locale,
      });
      break;

    case "bubbleAccessAlert":
      await queueBubbleAccessAlert({
        to,
        bubbleName: "Test Secret Santa Group",
        deviceName: "Chrome on Windows",
        ipAddress: "192.168.1.1",
        accessTime: new Date().toLocaleString(locale),
        locale,
      });
      break;

    case "mention":
      await queueMentionEmail({
        to,
        senderName: "Test User",
        bubbleName: "Test Group",
        bubbleUrl: `${baseUrl}/bubbles/test-id?tab=chat`,
        messagePreview: "Hey @you, check this out! I found the perfect gift idea.",
        locale,
      });
      break;

    default:
      throw new Error(`Unknown email type: ${type}`);
  }
}
