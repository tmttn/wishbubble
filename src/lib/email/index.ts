import { Resend } from "resend";
import { logger } from "@/lib/logger";

// Initialize Resend lazily to avoid build-time errors
let resend: Resend | null = null;

function getResend(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

const FROM_EMAIL = process.env.FROM_EMAIL || "WishBubble <noreply@notifications.wish-bubble.app>";

export async function sendBubbleInvitation({
  to,
  inviterName,
  bubbleName,
  inviteUrl,
  locale = "en",
}: {
  to: string;
  inviterName: string;
  bubbleName: string;
  inviteUrl: string;
  locale?: string;
}) {
  try {
    const t = getEmailTranslations(locale).invitation;
    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: t.subject(inviterName, bubbleName),
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${t.heading}</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #594a3c; margin: 0;">WishBubble</h1>
            </div>

            <div style="background: linear-gradient(135deg, #594a3c 0%, #c49b5f 100%); border-radius: 12px; padding: 30px; color: white; text-align: center; margin-bottom: 30px;">
              <h2 style="margin: 0 0 10px 0;">${t.heading}</h2>
              <p style="margin: 0; opacity: 0.9;">${t.subheading(inviterName)}</p>
            </div>

            <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
              <h3 style="margin: 0 0 10px 0; color: #1e293b;">${t.bubbleLabel} ${bubbleName}</h3>
              <p style="margin: 0; color: #64748b;">${t.description}</p>
            </div>

            <div style="text-align: center; margin-bottom: 30px;">
              <a href="${inviteUrl}" style="display: inline-block; background: #594a3c; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                ${t.button}
              </a>
            </div>

            <p style="color: #64748b; font-size: 14px; text-align: center;">
              ${t.expiry}
            </p>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

            <p style="color: #94a3b8; font-size: 12px; text-align: center;">
              ${t.footer}
            </p>
          </body>
        </html>
      `,
    });

    if (error) {
      logger.error("Failed to send bubble invitation email", error, { to, bubbleName, inviterName });
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    logger.error("Email sending error", error, { type: "invitation", to, bubbleName });
    return { success: false, error };
  }
}

export async function sendVerificationEmail({
  to,
  verificationUrl,
  locale = "en",
}: {
  to: string;
  verificationUrl: string;
  locale?: string;
}) {
  try {
    const t = getEmailTranslations(locale).verification;
    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: t.subject,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #594a3c; margin: 0;">WishBubble</h1>
            </div>

            <h2 style="text-align: center;">${t.heading}</h2>

            <p style="text-align: center; color: #64748b;">
              ${t.description}
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="display: inline-block; background: #594a3c; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                ${t.button}
              </a>
            </div>

            <p style="color: #94a3b8; font-size: 12px; text-align: center;">
              ${t.footer}
            </p>
          </body>
        </html>
      `,
    });

    if (error) {
      logger.error("Failed to send verification email", error, { to });
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    logger.error("Email sending error", error, { type: "verification", to });
    return { success: false, error };
  }
}

export async function sendPasswordResetEmail({
  to,
  resetUrl,
  locale = "en",
}: {
  to: string;
  resetUrl: string;
  locale?: string;
}) {
  try {
    const t = getEmailTranslations(locale).passwordReset;
    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: t.subject,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #594a3c; margin: 0;">WishBubble</h1>
            </div>

            <h2 style="text-align: center;">${t.heading}</h2>

            <p style="text-align: center; color: #64748b;">
              ${t.description}
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="display: inline-block; background: #594a3c; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                ${t.button}
              </a>
            </div>

            <p style="color: #64748b; font-size: 14px; text-align: center;">
              ${t.expiry}
            </p>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

            <p style="color: #94a3b8; font-size: 12px; text-align: center;">
              ${t.footer}
            </p>
          </body>
        </html>
      `,
    });

    if (error) {
      logger.error("Failed to send password reset email", error, { to });
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    logger.error("Email sending error", error, { type: "passwordReset", to });
    return { success: false, error };
  }
}

export async function sendEmailChangeVerification({
  to,
  verificationUrl,
  locale = "en",
}: {
  to: string;
  verificationUrl: string;
  locale?: string;
}) {
  try {
    const t = getEmailTranslations(locale).emailChange;
    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: t.subject,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #594a3c; margin: 0;">WishBubble</h1>
            </div>

            <h2 style="text-align: center;">${t.heading}</h2>

            <p style="text-align: center; color: #64748b;">
              ${t.description}
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="display: inline-block; background: #594a3c; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                ${t.button}
              </a>
            </div>

            <p style="color: #64748b; font-size: 14px; text-align: center;">
              ${t.expiry}
            </p>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

            <p style="color: #94a3b8; font-size: 12px; text-align: center;">
              ${t.footer}
            </p>
          </body>
        </html>
      `,
    });

    if (error) {
      logger.error("Failed to send email change verification", error, { to });
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    logger.error("Email sending error", error, { type: "emailChange", to });
    return { success: false, error };
  }
}

export async function sendMemberJoinedNotification({
  to,
  memberName,
  bubbleName,
  bubbleUrl,
  locale = "en",
}: {
  to: string;
  memberName: string;
  bubbleName: string;
  bubbleUrl: string;
  locale?: string;
}) {
  try {
    const t = getEmailTranslations(locale).memberJoined;
    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: t.subject(memberName, bubbleName),
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #594a3c; margin: 0;">WishBubble</h1>
            </div>

            <div style="background: linear-gradient(135deg, #594a3c 0%, #c49b5f 100%); border-radius: 12px; padding: 30px; color: white; text-align: center; margin-bottom: 30px;">
              <h2 style="margin: 0 0 10px 0;">${t.heading}</h2>
              <p style="margin: 0; opacity: 0.9;">${t.subheading(memberName)}</p>
            </div>

            <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
              <h3 style="margin: 0 0 10px 0; color: #1e293b;">${bubbleName}</h3>
              <p style="margin: 0; color: #64748b;">${t.description(memberName)}</p>
            </div>

            <div style="text-align: center; margin-bottom: 30px;">
              <a href="${bubbleUrl}" style="display: inline-block; background: #594a3c; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                ${t.button}
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

            <p style="color: #94a3b8; font-size: 12px; text-align: center;">
              ${t.footer(bubbleName)}
              <br>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://wish-bubble.app"}/settings" style="color: #594a3c;">${t.manage}</a>
            </p>
          </body>
        </html>
      `,
    });

    if (error) {
      logger.error("Failed to send member joined email", error, { to, memberName, bubbleName });
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    logger.error("Email sending error", error, { type: "memberJoined", to, bubbleName });
    return { success: false, error };
  }
}

export async function sendSecretSantaNotification({
  to,
  receiverName,
  bubbleName,
  bubbleUrl,
  locale = "en",
}: {
  to: string;
  receiverName: string;
  bubbleName: string;
  bubbleUrl: string;
  locale?: string;
}) {
  try {
    const t = getEmailTranslations(locale).secretSanta;
    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: t.subject(bubbleName),
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #594a3c; margin: 0;">WishBubble</h1>
            </div>

            <div style="background: linear-gradient(135deg, #dc2626 0%, #16a34a 100%); border-radius: 12px; padding: 30px; color: white; text-align: center; margin-bottom: 30px;">
              <h2 style="margin: 0 0 10px 0;">${t.heading}</h2>
              <p style="margin: 0; opacity: 0.9;">${t.subheading}</p>
            </div>

            <div style="background: #f8fafc; border-radius: 12px; padding: 30px; margin-bottom: 30px; text-align: center;">
              <h2 style="margin: 0; color: #1e293b; font-size: 28px;">${receiverName}</h2>
            </div>

            <p style="text-align: center; color: #64748b;">
              ${t.description}
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${bubbleUrl}" style="display: inline-block; background: #594a3c; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                ${t.button}
              </a>
            </div>

            <p style="color: #94a3b8; font-size: 12px; text-align: center;">
              ${t.footer}
            </p>
          </body>
        </html>
      `,
    });

    if (error) {
      logger.error("Failed to send Secret Santa email", error, { to, receiverName, bubbleName });
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    logger.error("Email sending error", error, { type: "secretSanta", to, bubbleName });
    return { success: false, error };
  }
}

// Helper to format dates based on locale
function formatDate(date: Date, locale: string = "en"): string {
  const localeMap: Record<string, string> = {
    en: "en-US",
    nl: "nl-NL",
  };
  return date.toLocaleDateString(localeMap[locale] || "en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatShortDate(date: Date, locale: string = "en"): string {
  const localeMap: Record<string, string> = {
    en: "en-US",
    nl: "nl-NL",
  };
  return date.toLocaleDateString(localeMap[locale] || "en-US", {
    month: "short",
    day: "numeric",
  });
}

// Email translations for notification emails
const emailTranslations: Record<string, {
  verification: {
    subject: string;
    heading: string;
    description: string;
    button: string;
    footer: string;
  };
  passwordReset: {
    subject: string;
    heading: string;
    description: string;
    button: string;
    expiry: string;
    footer: string;
  };
  invitation: {
    subject: (inviterName: string, bubbleName: string) => string;
    heading: string;
    subheading: (inviterName: string) => string;
    bubbleLabel: string;
    description: string;
    button: string;
    expiry: string;
    footer: string;
  };
  memberJoined: {
    subject: (memberName: string, bubbleName: string) => string;
    heading: string;
    subheading: (memberName: string) => string;
    description: (memberName: string) => string;
    button: string;
    footer: (bubbleName: string) => string;
    manage: string;
  };
  secretSanta: {
    subject: (bubbleName: string) => string;
    heading: string;
    subheading: string;
    description: string;
    button: string;
    footer: string;
  };
  wishlistReminder: {
    subject: (bubbleName: string) => string;
    heading: string;
    subheading: string;
    greeting: (name: string) => string;
    body: (bubbleName: string) => string;
    eventNote: (date: string) => string;
    button: string;
    footer: (bubbleName: string) => string;
    manage: string;
  };
  eventApproaching: {
    subject: (bubbleName: string, urgency: string) => string;
    heading: string;
    subheading: (bubbleName: string, urgency: string) => string;
    greeting: (name: string) => string;
    body: (bubbleName: string, urgency: string, date: string) => string;
    checklistTitle: string;
    checklist: string[];
    button: string;
    footer: (bubbleName: string) => string;
    manage: string;
    tomorrow: string;
    inOneWeek: string;
    inDays: (days: number) => string;
  };
  weeklyDigest: {
    subject: string;
    heading: string;
    subheading: string;
    greeting: (name: string) => string;
    body: string;
    newMembers: (count: number) => string;
    newItems: (count: number) => string;
    eventOn: (date: string) => string;
    viewBubble: string;
    button: string;
    footer: string;
    manage: string;
  };
  emailChange: {
    subject: string;
    heading: string;
    description: string;
    button: string;
    expiry: string;
    footer: string;
  };
  groupDeleted: {
    subject: (bubbleName: string) => string;
    heading: string;
    subheading: (bubbleName: string) => string;
    description: (ownerName: string) => string;
    footer: string;
  };
  accountSuspended: {
    subject: string;
    heading: string;
    subheading: string;
    description: string;
    reason: string;
    duration: string;
    permanent: string;
    until: (date: string) => string;
    appeal: string;
    footer: string;
  };
  accountTerminated: {
    subject: string;
    heading: string;
    subheading: string;
    description: string;
    reason: string;
    subscriptionNote: string;
    footer: string;
  };
  bubbleAccess: {
    subject: (bubbleName: string) => string;
    heading: string;
    subheading: string;
    description: (bubbleName: string) => string;
    deviceLabel: string;
    timeLabel: string;
    ipLabel: string;
    warning: string;
    footer: string;
    manage: string;
  };
  mention: {
    subject: (senderName: string, bubbleName: string) => string;
    heading: string;
    subheading: (senderName: string) => string;
    description: (bubbleName: string) => string;
    messageLabel: string;
    button: string;
    footer: (bubbleName: string) => string;
    manage: string;
  };
}> = {
  en: {
    verification: {
      subject: "Verify your WishBubble email",
      heading: "Verify Your Email",
      description: "Click the button below to verify your email address and complete your registration.",
      button: "Verify Email",
      footer: "If you didn't create an account, you can safely ignore this email.",
    },
    passwordReset: {
      subject: "Reset your WishBubble password",
      heading: "Reset Your Password",
      description: "You requested a password reset for your WishBubble account. Click the button below to set a new password.",
      button: "Reset Password",
      expiry: "This link will expire in 1 hour.",
      footer: "If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.",
    },
    invitation: {
      subject: (inviterName, bubbleName) => `${inviterName} invited you to join "${bubbleName}" on WishBubble`,
      heading: "You're Invited!",
      subheading: (inviterName) => `${inviterName} wants you to join their gift exchange`,
      bubbleLabel: "Bubble:",
      description: "Join this bubble to share your wishlist and see what others are hoping for. It's the perfect way to coordinate gifts!",
      button: "Accept Invitation",
      expiry: "This invitation link will expire in 7 days.",
      footer: "If you didn't expect this invitation, you can safely ignore this email.",
    },
    memberJoined: {
      subject: (memberName, bubbleName) => `${memberName} joined "${bubbleName}" on WishBubble`,
      heading: "New Member Joined!",
      subheading: (memberName) => `${memberName} is now part of your group`,
      description: (memberName) => `${memberName} has accepted the invitation and joined your bubble. They can now view wishlists and participate in the gift exchange!`,
      button: "View Bubble",
      footer: (bubbleName) => `You're receiving this because you're a member of "${bubbleName}".`,
      manage: "Manage notification preferences",
    },
    secretSanta: {
      subject: (bubbleName) => `Secret Santa Draw - ${bubbleName}`,
      heading: "The Secret Santa Draw is Complete!",
      subheading: "You're buying a gift for...",
      description: "Check out their wishlist to find the perfect gift!",
      button: "View Their Wishlist",
      footer: "Remember: Keep it a secret!",
    },
    wishlistReminder: {
      subject: (bubbleName) => `Don't forget to add your wishlist to "${bubbleName}"`,
      heading: "Add Your Wishlist!",
      subheading: "Help others find the perfect gift for you",
      greeting: (name) => `Hi ${name},`,
      body: (bubbleName) => `We noticed you haven't added a wishlist to <strong>${bubbleName}</strong> yet. Adding your wishlist helps other members know what to get you!`,
      eventNote: (date) => `The event is coming up on <strong>${date}</strong>.`,
      button: "Add Your Wishlist",
      footer: (bubbleName) => `You're receiving this because you're a member of "${bubbleName}".`,
      manage: "Manage notification preferences",
    },
    eventApproaching: {
      subject: (bubbleName, urgency) => `"${bubbleName}" is ${urgency}!`,
      heading: "Event Coming Up!",
      subheading: (bubbleName, urgency) => `${bubbleName} is ${urgency}`,
      greeting: (name) => `Hi ${name},`,
      body: (bubbleName, urgency, date) => `Just a friendly reminder that <strong>${bubbleName}</strong> is happening ${urgency} on <strong>${date}</strong>.`,
      checklistTitle: "Quick checklist:",
      checklist: [
        "Have you added your wishlist?",
        "Have you claimed any gifts?",
        "Have you purchased the items you claimed?",
      ],
      button: "View Bubble",
      footer: (bubbleName) => `You're receiving this because you're a member of "${bubbleName}".`,
      manage: "Manage notification preferences",
      tomorrow: "tomorrow",
      inOneWeek: "in one week",
      inDays: (days) => `in ${days} days`,
    },
    weeklyDigest: {
      subject: "Your Weekly WishBubble Digest",
      heading: "Weekly Digest",
      subheading: "Here's what's happening in your bubbles",
      greeting: (name) => `Hi ${name},`,
      body: "Here's a summary of activity in your bubbles this week:",
      newMembers: (count) => `${count} new member${count !== 1 ? "s" : ""}`,
      newItems: (count) => `${count} new wishlist item${count !== 1 ? "s" : ""}`,
      eventOn: (date) => `Event on ${date}`,
      viewBubble: "View bubble →",
      button: "View All Bubbles",
      footer: "You're receiving this weekly digest based on your preferences.",
      manage: "Manage notification preferences",
    },
    emailChange: {
      subject: "Confirm your new email address",
      heading: "Confirm Email Change",
      description: "You requested to change your WishBubble email to this address. Click the button below to confirm.",
      button: "Confirm New Email",
      expiry: "This link will expire in 24 hours.",
      footer: "If you didn't request this change, you can safely ignore this email. Your email will remain unchanged.",
    },
    groupDeleted: {
      subject: (bubbleName) => `"${bubbleName}" has been deleted`,
      heading: "Group Deleted",
      subheading: (bubbleName) => `${bubbleName} is no longer available`,
      description: (ownerName) => `${ownerName} has deleted this group. All wishlists and claims associated with this group have been removed.`,
      footer: "Thank you for being part of this group!",
    },
    accountSuspended: {
      subject: "Your WishBubble account has been suspended",
      heading: "Account Suspended",
      subheading: "Your access to WishBubble has been restricted",
      description: "Your account has been suspended due to a violation of our Terms of Service.",
      reason: "Reason",
      duration: "Duration",
      permanent: "Permanent",
      until: (date: string) => `Until ${date}`,
      appeal: "If you believe this is a mistake, please contact us through our contact form.",
      footer: "This message was sent by the WishBubble team.",
    },
    accountTerminated: {
      subject: "Your WishBubble account has been deleted",
      heading: "Account Deleted",
      subheading: "Your WishBubble account has been permanently deleted",
      description: "Your account has been deleted due to a violation of our Terms of Service. All associated data has been removed.",
      reason: "Reason",
      subscriptionNote: "If you had an active subscription, it has been cancelled and no further charges will be made.",
      footer: "This message was sent by the WishBubble team.",
    },
    bubbleAccess: {
      subject: (bubbleName) => `Security Alert: Your Secret Santa bubble "${bubbleName}" was accessed`,
      heading: "New Device Access Detected",
      subheading: "Your Secret Santa bubble was accessed from a new device",
      description: (bubbleName) => `Your Secret Santa bubble "${bubbleName}" was just accessed from a device we haven't seen before.`,
      deviceLabel: "Device",
      timeLabel: "Time",
      ipLabel: "IP Address",
      warning: "If this wasn't you, someone may have access to your account. Consider changing your password and setting up a PIN for your Secret Santa bubbles.",
      footer: "You're receiving this because you have access alerts enabled for your Secret Santa bubbles.",
      manage: "Manage notification preferences",
    },
    mention: {
      subject: (senderName, bubbleName) => `${senderName} mentioned you in "${bubbleName}"`,
      heading: "You were mentioned!",
      subheading: (senderName) => `${senderName} mentioned you in a chat message`,
      description: (bubbleName) => `You were mentioned in a chat message in ${bubbleName}. Check out what they said!`,
      messageLabel: "Message",
      button: "View Chat",
      footer: (bubbleName) => `You're receiving this because you're a member of "${bubbleName}".`,
      manage: "Manage notification preferences",
    },
  },
  nl: {
    verification: {
      subject: "Verifieer je WishBubble e-mail",
      heading: "Verifieer je e-mail",
      description: "Klik op de onderstaande knop om je e-mailadres te verifiëren en je registratie te voltooien.",
      button: "E-mail verifiëren",
      footer: "Als je geen account hebt aangemaakt, kun je deze e-mail negeren.",
    },
    passwordReset: {
      subject: "Herstel je WishBubble wachtwoord",
      heading: "Wachtwoord herstellen",
      description: "Je hebt een wachtwoordherstel aangevraagd voor je WishBubble account. Klik op de onderstaande knop om een nieuw wachtwoord in te stellen.",
      button: "Wachtwoord herstellen",
      expiry: "Deze link verloopt over 1 uur.",
      footer: "Als je geen wachtwoordherstel hebt aangevraagd, kun je deze e-mail negeren. Je wachtwoord blijft ongewijzigd.",
    },
    invitation: {
      subject: (inviterName, bubbleName) => `${inviterName} heeft je uitgenodigd voor "${bubbleName}" op WishBubble`,
      heading: "Je bent uitgenodigd!",
      subheading: (inviterName) => `${inviterName} wil dat je meedoet aan hun cadeau-uitwisseling`,
      bubbleLabel: "Groep:",
      description: "Doe mee met deze groep om je verlanglijst te delen en te zien wat anderen graag willen. De perfecte manier om cadeaus te coördineren!",
      button: "Uitnodiging accepteren",
      expiry: "Deze uitnodigingslink verloopt over 7 dagen.",
      footer: "Als je deze uitnodiging niet verwachtte, kun je deze e-mail negeren.",
    },
    memberJoined: {
      subject: (memberName, bubbleName) => `${memberName} is lid geworden van "${bubbleName}" op WishBubble`,
      heading: "Nieuw lid!",
      subheading: (memberName) => `${memberName} maakt nu deel uit van je groep`,
      description: (memberName) => `${memberName} heeft de uitnodiging geaccepteerd en is lid geworden van je groep. Ze kunnen nu verlanglijsten bekijken en meedoen aan de cadeau-uitwisseling!`,
      button: "Bekijk groep",
      footer: (bubbleName) => `Je ontvangt dit bericht omdat je lid bent van "${bubbleName}".`,
      manage: "Notificatievoorkeuren beheren",
    },
    secretSanta: {
      subject: (bubbleName) => `Secret Santa loting - ${bubbleName}`,
      heading: "De Secret Santa loting is voltooid!",
      subheading: "Je koopt een cadeau voor...",
      description: "Bekijk hun verlanglijst om het perfecte cadeau te vinden!",
      button: "Bekijk hun verlanglijst",
      footer: "Onthoud: Hou het geheim!",
    },
    wishlistReminder: {
      subject: (bubbleName) => `Vergeet niet je verlanglijst toe te voegen aan "${bubbleName}"`,
      heading: "Voeg je verlanglijst toe!",
      subheading: "Help anderen het perfecte cadeau voor jou te vinden",
      greeting: (name) => `Hoi ${name},`,
      body: (bubbleName) => `We merkten op dat je nog geen verlanglijst hebt toegevoegd aan <strong>${bubbleName}</strong>. Door je verlanglijst toe te voegen weten andere leden wat ze voor je kunnen kopen!`,
      eventNote: (date) => `Het evenement is op <strong>${date}</strong>.`,
      button: "Verlanglijst toevoegen",
      footer: (bubbleName) => `Je ontvangt dit bericht omdat je lid bent van "${bubbleName}".`,
      manage: "Notificatievoorkeuren beheren",
    },
    eventApproaching: {
      subject: (bubbleName, urgency) => `"${bubbleName}" is ${urgency}!`,
      heading: "Evenement komt eraan!",
      subheading: (bubbleName, urgency) => `${bubbleName} is ${urgency}`,
      greeting: (name) => `Hoi ${name},`,
      body: (bubbleName, urgency, date) => `Even een vriendelijke herinnering dat <strong>${bubbleName}</strong> ${urgency} plaatsvindt op <strong>${date}</strong>.`,
      checklistTitle: "Snelle checklist:",
      checklist: [
        "Heb je je verlanglijst toegevoegd?",
        "Heb je cadeaus geclaimd?",
        "Heb je de geclaimde items gekocht?",
      ],
      button: "Bekijk groep",
      footer: (bubbleName) => `Je ontvangt dit bericht omdat je lid bent van "${bubbleName}".`,
      manage: "Notificatievoorkeuren beheren",
      tomorrow: "morgen",
      inOneWeek: "over een week",
      inDays: (days) => `over ${days} dagen`,
    },
    weeklyDigest: {
      subject: "Je wekelijkse WishBubble samenvatting",
      heading: "Wekelijkse samenvatting",
      subheading: "Dit is wat er gebeurt in je groepen",
      greeting: (name) => `Hoi ${name},`,
      body: "Hier is een samenvatting van de activiteit in je groepen deze week:",
      newMembers: (count) => `${count} nieuw${count !== 1 ? "e" : ""} ${count === 1 ? "lid" : "leden"}`,
      newItems: (count) => `${count} nieuw${count !== 1 ? "e" : ""} verlanglijst ${count === 1 ? "item" : "items"}`,
      eventOn: (date) => `Evenement op ${date}`,
      viewBubble: "Bekijk groep →",
      button: "Bekijk alle groepen",
      footer: "Je ontvangt deze wekelijkse samenvatting op basis van je voorkeuren.",
      manage: "Notificatievoorkeuren beheren",
    },
    emailChange: {
      subject: "Bevestig je nieuwe e-mailadres",
      heading: "Bevestig e-mailwijziging",
      description: "Je hebt gevraagd om je WishBubble e-mail te wijzigen naar dit adres. Klik op de onderstaande knop om te bevestigen.",
      button: "Nieuwe e-mail bevestigen",
      expiry: "Deze link verloopt over 24 uur.",
      footer: "Als je deze wijziging niet hebt aangevraagd, kun je deze e-mail negeren. Je e-mailadres blijft ongewijzigd.",
    },
    groupDeleted: {
      subject: (bubbleName) => `"${bubbleName}" is verwijderd`,
      heading: "Groep verwijderd",
      subheading: (bubbleName) => `${bubbleName} is niet meer beschikbaar`,
      description: (ownerName) => `${ownerName} heeft deze groep verwijderd. Alle verlanglijsten en claims die aan deze groep waren gekoppeld zijn verwijderd.`,
      footer: "Bedankt dat je deel uitmaakte van deze groep!",
    },
    accountSuspended: {
      subject: "Je WishBubble account is tijdelijk geschorst",
      heading: "Account geschorst",
      subheading: "Je toegang tot WishBubble is beperkt",
      description: "Je account is geschorst vanwege een overtreding van onze Gebruiksvoorwaarden.",
      reason: "Reden",
      duration: "Duur",
      permanent: "Permanent",
      until: (date: string) => `Tot ${date}`,
      appeal: "Als je denkt dat dit een vergissing is, neem dan contact met ons op via het contactformulier.",
      footer: "Dit bericht is verzonden door het WishBubble team.",
    },
    accountTerminated: {
      subject: "Je WishBubble account is verwijderd",
      heading: "Account verwijderd",
      subheading: "Je WishBubble account is permanent verwijderd",
      description: "Je account is verwijderd vanwege een overtreding van onze Gebruiksvoorwaarden. Alle bijbehorende gegevens zijn verwijderd.",
      reason: "Reden",
      subscriptionNote: "Als je een actief abonnement had, is dit geannuleerd en worden er geen verdere kosten in rekening gebracht.",
      footer: "Dit bericht is verzonden door het WishBubble team.",
    },
    bubbleAccess: {
      subject: (bubbleName) => `Beveiligingsmelding: Je Secret Santa groep "${bubbleName}" is geopend`,
      heading: "Nieuw apparaat gedetecteerd",
      subheading: "Je Secret Santa groep is geopend vanaf een nieuw apparaat",
      description: (bubbleName) => `Je Secret Santa groep "${bubbleName}" is zojuist geopend vanaf een apparaat dat we nog niet eerder hebben gezien.`,
      deviceLabel: "Apparaat",
      timeLabel: "Tijd",
      ipLabel: "IP-adres",
      warning: "Als jij dit niet was, heeft iemand mogelijk toegang tot je account. Overweeg je wachtwoord te wijzigen en een PIN in te stellen voor je Secret Santa groepen.",
      footer: "Je ontvangt dit bericht omdat je toegangsmeldingen hebt ingeschakeld voor je Secret Santa groepen.",
      manage: "Notificatievoorkeuren beheren",
    },
    mention: {
      subject: (senderName, bubbleName) => `${senderName} heeft je genoemd in "${bubbleName}"`,
      heading: "Je bent genoemd!",
      subheading: (senderName) => `${senderName} heeft je genoemd in een chatbericht`,
      description: (bubbleName) => `Je bent genoemd in een chatbericht in ${bubbleName}. Bekijk wat ze zeiden!`,
      messageLabel: "Bericht",
      button: "Bekijk chat",
      footer: (bubbleName) => `Je ontvangt dit bericht omdat je lid bent van "${bubbleName}".`,
      manage: "Notificatievoorkeuren beheren",
    },
  },
};

function getEmailTranslations(locale: string = "en") {
  return emailTranslations[locale] || emailTranslations.en;
}

export async function sendWishlistReminderEmail({
  to,
  userName,
  bubbleName,
  bubbleUrl,
  eventDate,
  locale = "en",
}: {
  to: string;
  userName: string;
  bubbleName: string;
  bubbleUrl: string;
  eventDate?: Date;
  locale?: string;
}) {
  try {
    const t = getEmailTranslations(locale).wishlistReminder;
    const eventDateStr = eventDate ? formatDate(eventDate, locale) : null;

    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: t.subject(bubbleName),
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #594a3c; margin: 0;">WishBubble</h1>
            </div>

            <div style="background: linear-gradient(135deg, #594a3c 0%, #c49b5f 100%); border-radius: 12px; padding: 30px; color: white; text-align: center; margin-bottom: 30px;">
              <h2 style="margin: 0 0 10px 0;">${t.heading}</h2>
              <p style="margin: 0; opacity: 0.9;">${t.subheading}</p>
            </div>

            <p style="margin-bottom: 20px;">${t.greeting(userName)}</p>

            <p style="margin-bottom: 20px;">${t.body(bubbleName)}</p>

            ${eventDateStr ? `<p style="margin-bottom: 20px; color: #64748b;">${t.eventNote(eventDateStr)}</p>` : ""}

            <div style="text-align: center; margin: 30px 0;">
              <a href="${bubbleUrl}" style="display: inline-block; background: #594a3c; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                ${t.button}
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

            <p style="color: #94a3b8; font-size: 12px; text-align: center;">
              ${t.footer(bubbleName)}
              <br>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://wish-bubble.app"}/settings" style="color: #594a3c;">${t.manage}</a>
            </p>
          </body>
        </html>
      `,
    });

    if (error) {
      logger.error("Failed to send wishlist reminder email", error, { to, userName, bubbleName });
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    logger.error("Email sending error", error, { type: "wishlistReminder", to, bubbleName });
    return { success: false, error };
  }
}

export async function sendEventApproachingEmail({
  to,
  userName,
  bubbleName,
  bubbleUrl,
  eventDate,
  daysUntil,
  locale = "en",
}: {
  to: string;
  userName: string;
  bubbleName: string;
  bubbleUrl: string;
  eventDate: Date;
  daysUntil: number;
  locale?: string;
}) {
  try {
    const t = getEmailTranslations(locale).eventApproaching;
    const eventDateStr = formatDate(eventDate, locale);

    const urgencyText = daysUntil === 1
      ? t.tomorrow
      : daysUntil === 7
        ? t.inOneWeek
        : t.inDays(daysUntil);

    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: t.subject(bubbleName, urgencyText),
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #594a3c; margin: 0;">WishBubble</h1>
            </div>

            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 12px; padding: 30px; color: white; text-align: center; margin-bottom: 30px;">
              <h2 style="margin: 0 0 10px 0;">${t.heading}</h2>
              <p style="margin: 0; opacity: 0.9;">${t.subheading(bubbleName, urgencyText)}</p>
            </div>

            <p style="margin-bottom: 20px;">${t.greeting(userName)}</p>

            <p style="margin-bottom: 20px;">${t.body(bubbleName, urgencyText, eventDateStr)}</p>

            <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
              <h3 style="margin: 0 0 10px 0; color: #1e293b;">${t.checklistTitle}</h3>
              <ul style="margin: 0; color: #64748b; padding-left: 20px;">
                ${t.checklist.map((item) => `<li>${item}</li>`).join("")}
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${bubbleUrl}" style="display: inline-block; background: #594a3c; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                ${t.button}
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

            <p style="color: #94a3b8; font-size: 12px; text-align: center;">
              ${t.footer(bubbleName)}
              <br>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://wish-bubble.app"}/settings" style="color: #594a3c;">${t.manage}</a>
            </p>
          </body>
        </html>
      `,
    });

    if (error) {
      logger.error("Failed to send event approaching email", error, { to, userName, bubbleName, daysUntil });
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    logger.error("Email sending error", error, { type: "eventApproaching", to, bubbleName, daysUntil });
    return { success: false, error };
  }
}

export async function sendWeeklyDigestEmail({
  to,
  userName,
  bubbles,
  locale = "en",
}: {
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
}) {
  try {
    const t = getEmailTranslations(locale).weeklyDigest;
    const bubblesHtml = bubbles
      .map((bubble) => {
        const eventStr = bubble.upcomingEvent
          ? t.eventOn(formatShortDate(bubble.upcomingEvent, locale))
          : "";
        return `
          <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 15px;">
            <h3 style="margin: 0 0 10px 0; color: #1e293b;">${bubble.name}</h3>
            <p style="margin: 0; color: #64748b; font-size: 14px;">
              ${bubble.newMembers > 0 ? `${t.newMembers(bubble.newMembers)} • ` : ""}
              ${bubble.newItems > 0 ? `${t.newItems(bubble.newItems)} • ` : ""}
              ${eventStr}
            </p>
            <a href="${bubble.url}" style="color: #594a3c; font-size: 14px; text-decoration: none;">${t.viewBubble}</a>
          </div>
        `;
      })
      .join("");

    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: t.subject,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #594a3c; margin: 0;">WishBubble</h1>
            </div>

            <div style="background: linear-gradient(135deg, #594a3c 0%, #c49b5f 100%); border-radius: 12px; padding: 30px; color: white; text-align: center; margin-bottom: 30px;">
              <h2 style="margin: 0 0 10px 0;">${t.heading}</h2>
              <p style="margin: 0; opacity: 0.9;">${t.subheading}</p>
            </div>

            <p style="margin-bottom: 20px;">${t.greeting(userName)}</p>

            <p style="margin-bottom: 20px;">${t.body}</p>

            ${bubblesHtml}

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://wish-bubble.app"}/bubbles" style="display: inline-block; background: #594a3c; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                ${t.button}
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

            <p style="color: #94a3b8; font-size: 12px; text-align: center;">
              ${t.footer}
              <br>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://wish-bubble.app"}/settings" style="color: #594a3c;">${t.manage}</a>
            </p>
          </body>
        </html>
      `,
    });

    if (error) {
      logger.error("Failed to send weekly digest email", error, { to, userName, bubbleCount: bubbles.length });
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    logger.error("Email sending error", error, { type: "weeklyDigest", to, bubbleCount: bubbles.length });
    return { success: false, error };
  }
}

const subjectLabels: Record<string, string> = {
  PRIVACY_REQUEST: "Privacy Request (GDPR)",
  DATA_DELETION: "Data Deletion Request",
  DATA_EXPORT: "Data Export Request",
  BUG_REPORT: "Bug Report",
  FEATURE_REQUEST: "Feature Request",
  GENERAL_INQUIRY: "General Inquiry",
  OTHER: "Other",
};

export async function sendContactFormNotification({
  to,
  submissionId,
  senderName,
  senderEmail,
  subject,
  message,
  adminUrl,
}: {
  to: string;
  submissionId: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  message: string;
  adminUrl: string;
}) {
  try {
    const subjectLabel = subjectLabels[subject] || subject;
    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: `[Contact Form] ${subjectLabel} from ${senderName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #594a3c; margin: 0;">WishBubble Admin</h1>
            </div>

            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 12px; padding: 30px; color: white; text-align: center; margin-bottom: 30px;">
              <h2 style="margin: 0 0 10px 0;">New Contact Form Submission</h2>
              <p style="margin: 0; opacity: 0.9;">${subjectLabel}</p>
            </div>

            <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
              <p style="margin: 0 0 10px 0;"><strong>From:</strong> ${senderName}</p>
              <p style="margin: 0;"><strong>Email:</strong> <a href="mailto:${senderEmail}" style="color: #594a3c;">${senderEmail}</a></p>
            </div>

            <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
              <h3 style="margin: 0 0 10px 0; color: #1e293b;">Message:</h3>
              <p style="margin: 0; color: #64748b; white-space: pre-wrap;">${message}</p>
            </div>

            <div style="text-align: center; margin-bottom: 30px;">
              <a href="${adminUrl}" style="display: inline-block; background: #594a3c; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                View in Admin Panel
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

            <p style="color: #94a3b8; font-size: 12px; text-align: center;">
              This is an automated notification from WishBubble.
            </p>
          </body>
        </html>
      `,
    });

    if (error) {
      logger.error("Failed to send contact form notification", error, { to, senderEmail, subject });
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    logger.error("Email sending error", error, { type: "contactForm", to, senderEmail });
    return { success: false, error };
  }
}

const replyEmailTranslations: Record<
  string,
  { greeting: string; originalMessage: string; footer: string }
> = {
  en: {
    greeting: "Hi",
    originalMessage: "Your original message:",
    footer: "This is a reply to your contact form submission on WishBubble.",
  },
  nl: {
    greeting: "Hoi",
    originalMessage: "Je oorspronkelijke bericht:",
    footer: "Dit is een antwoord op je contactformulier op WishBubble.",
  },
};

export async function sendContactReply({
  to,
  senderName,
  subject,
  originalMessage,
  replyMessage,
  replyFrom,
  locale = "en",
}: {
  to: string;
  senderName: string;
  subject: string;
  originalMessage: string;
  replyMessage: string;
  replyFrom: string;
  locale?: string;
}) {
  try {
    const subjectLabel = subjectLabels[subject] || subject;
    const t = replyEmailTranslations[locale] || replyEmailTranslations.en;
    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      replyTo: replyFrom,
      subject: `Re: ${subjectLabel} - WishBubble`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #594a3c; margin: 0;">WishBubble</h1>
            </div>

            <p style="margin-bottom: 20px;">${t.greeting} ${senderName},</p>

            <div style="margin-bottom: 30px; white-space: pre-wrap;">${replyMessage}</div>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

            <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
              <p style="margin: 0 0 10px 0; color: #64748b; font-size: 14px;"><strong>${t.originalMessage}</strong></p>
              <p style="margin: 0; color: #64748b; font-size: 14px; white-space: pre-wrap;">${originalMessage}</p>
            </div>

            <p style="color: #94a3b8; font-size: 12px; text-align: center;">
              ${t.footer}
            </p>
          </body>
        </html>
      `,
    });

    if (error) {
      logger.error("Failed to send contact reply", error, { to, subject });
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    logger.error("Email sending error", error, { type: "contactReply", to });
    return { success: false, error };
  }
}

export async function sendGroupDeletedEmail({
  to,
  bubbleName,
  ownerName,
  locale = "en",
}: {
  to: string;
  bubbleName: string;
  ownerName: string;
  locale?: string;
}) {
  try {
    const t = getEmailTranslations(locale).groupDeleted;
    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: t.subject(bubbleName),
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #594a3c; margin: 0;">WishBubble</h1>
            </div>

            <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border-radius: 12px; padding: 30px; color: white; text-align: center; margin-bottom: 30px;">
              <h2 style="margin: 0 0 10px 0;">${t.heading}</h2>
              <p style="margin: 0; opacity: 0.9;">${t.subheading(bubbleName)}</p>
            </div>

            <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
              <p style="margin: 0; color: #64748b;">${t.description(ownerName)}</p>
            </div>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

            <p style="color: #94a3b8; font-size: 12px; text-align: center;">
              ${t.footer}
            </p>
          </body>
        </html>
      `,
    });

    if (error) {
      logger.error("Failed to send group deleted email", error, { to, bubbleName, ownerName });
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    logger.error("Email sending error", error, { type: "groupDeleted", to, bubbleName });
    return { success: false, error };
  }
}

export async function sendAccountSuspendedEmail({
  to,
  reason,
  suspendedUntil,
  locale = "en",
}: {
  to: string;
  reason: string;
  suspendedUntil: Date | null;
  locale?: string;
}) {
  try {
    const t = getEmailTranslations(locale).accountSuspended;
    const durationText = suspendedUntil
      ? t.until(formatDate(suspendedUntil, locale))
      : t.permanent;

    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: t.subject,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #594a3c; margin: 0;">WishBubble</h1>
            </div>

            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 12px; padding: 30px; color: white; text-align: center; margin-bottom: 30px;">
              <h2 style="margin: 0 0 10px 0;">${t.heading}</h2>
              <p style="margin: 0; opacity: 0.9;">${t.subheading}</p>
            </div>

            <p style="margin-bottom: 20px;">${t.description}</p>

            <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
              <p style="margin: 0 0 10px 0;"><strong>${t.reason}:</strong> ${reason}</p>
              <p style="margin: 0;"><strong>${t.duration}:</strong> ${durationText}</p>
            </div>

            <p style="margin-bottom: 20px; color: #64748b;">${t.appeal}</p>

            <div style="text-align: center; margin-bottom: 30px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://wish-bubble.app"}/contact" style="display: inline-block; background: #594a3c; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Contact Us
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

            <p style="color: #94a3b8; font-size: 12px; text-align: center;">
              ${t.footer}
            </p>
          </body>
        </html>
      `,
    });

    if (error) {
      logger.error("Failed to send account suspended email", error, { to });
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    logger.error("Email sending error", error, { type: "accountSuspended", to });
    return { success: false, error };
  }
}

export async function sendAccountTerminatedEmail({
  to,
  reason,
  hadSubscription,
  locale = "en",
}: {
  to: string;
  reason: string;
  hadSubscription: boolean;
  locale?: string;
}) {
  try {
    const t = getEmailTranslations(locale).accountTerminated;

    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: t.subject,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #594a3c; margin: 0;">WishBubble</h1>
            </div>

            <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border-radius: 12px; padding: 30px; color: white; text-align: center; margin-bottom: 30px;">
              <h2 style="margin: 0 0 10px 0;">${t.heading}</h2>
              <p style="margin: 0; opacity: 0.9;">${t.subheading}</p>
            </div>

            <p style="margin-bottom: 20px;">${t.description}</p>

            <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
              <p style="margin: 0;"><strong>${t.reason}:</strong> ${reason}</p>
            </div>

            ${hadSubscription ? `<p style="margin-bottom: 20px; color: #64748b;">${t.subscriptionNote}</p>` : ""}

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

            <p style="color: #94a3b8; font-size: 12px; text-align: center;">
              ${t.footer}
            </p>
          </body>
        </html>
      `,
    });

    if (error) {
      logger.error("Failed to send account terminated email", error, { to });
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    logger.error("Email sending error", error, { type: "accountTerminated", to });
    return { success: false, error };
  }
}

export async function sendBubbleAccessAlert({
  to,
  bubbleName,
  deviceName,
  ipAddress,
  accessTime,
  locale = "en",
}: {
  to: string;
  bubbleName: string;
  deviceName: string;
  ipAddress: string;
  accessTime: string;
  locale?: string;
}) {
  try {
    const t = getEmailTranslations(locale).bubbleAccess;

    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: t.subject(bubbleName),
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #594a3c; margin: 0;">WishBubble</h1>
            </div>

            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 12px; padding: 30px; color: white; text-align: center; margin-bottom: 30px;">
              <h2 style="margin: 0 0 10px 0;">${t.heading}</h2>
              <p style="margin: 0; opacity: 0.9;">${t.subheading}</p>
            </div>

            <p style="margin-bottom: 20px;">${t.description(bubbleName)}</p>

            <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
              <p style="margin: 0 0 10px 0;"><strong>${t.deviceLabel}:</strong> ${deviceName}</p>
              <p style="margin: 0 0 10px 0;"><strong>${t.timeLabel}:</strong> ${accessTime}</p>
              <p style="margin: 0;"><strong>${t.ipLabel}:</strong> ${ipAddress}</p>
            </div>

            <div style="background: #fef3c7; border-radius: 12px; padding: 20px; margin-bottom: 30px; border-left: 4px solid #f59e0b;">
              <p style="margin: 0; color: #92400e;">${t.warning}</p>
            </div>

            <div style="text-align: center; margin-bottom: 30px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://wish-bubble.app"}/settings" style="display: inline-block; background: #594a3c; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Review Security Settings
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

            <p style="color: #94a3b8; font-size: 12px; text-align: center;">
              ${t.footer}
              <br>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://wish-bubble.app"}/settings" style="color: #594a3c;">${t.manage}</a>
            </p>
          </body>
        </html>
      `,
    });

    if (error) {
      logger.error("Failed to send bubble access alert email", error, { to, bubbleName, deviceName });
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    logger.error("Email sending error", error, { type: "bubbleAccessAlert", to, bubbleName });
    return { success: false, error };
  }
}

export async function sendMentionEmail({
  to,
  senderName,
  bubbleName,
  bubbleUrl,
  messagePreview,
  locale = "en",
}: {
  to: string;
  senderName: string;
  bubbleName: string;
  bubbleUrl: string;
  messagePreview: string;
  locale?: string;
}) {
  try {
    const t = getEmailTranslations(locale).mention;

    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: t.subject(senderName, bubbleName),
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #594a3c; margin: 0;">WishBubble</h1>
            </div>

            <div style="background: linear-gradient(135deg, #594a3c 0%, #c49b5f 100%); border-radius: 12px; padding: 30px; color: white; text-align: center; margin-bottom: 30px;">
              <h2 style="margin: 0 0 10px 0;">${t.heading}</h2>
              <p style="margin: 0; opacity: 0.9;">${t.subheading(senderName)}</p>
            </div>

            <p style="margin-bottom: 20px;">${t.description(bubbleName)}</p>

            <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
              <p style="margin: 0 0 10px 0; color: #64748b; font-size: 14px;"><strong>${t.messageLabel}:</strong></p>
              <p style="margin: 0; color: #1e293b;">"${messagePreview}"</p>
            </div>

            <div style="text-align: center; margin-bottom: 30px;">
              <a href="${bubbleUrl}" style="display: inline-block; background: #594a3c; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                ${t.button}
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

            <p style="color: #94a3b8; font-size: 12px; text-align: center;">
              ${t.footer(bubbleName)}
              <br>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://wish-bubble.app"}/settings" style="color: #594a3c;">${t.manage}</a>
            </p>
          </body>
        </html>
      `,
    });

    if (error) {
      logger.error("Failed to send mention email", error, { to, senderName, bubbleName });
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    logger.error("Email sending error", error, { type: "mention", to, bubbleName });
    return { success: false, error };
  }
}

// Owner Digest Email - Daily/Weekly summary for app owner
import type { OwnerDigestData } from "@/lib/admin/get-owner-digest-data";

function getHealthIndicator(level: "healthy" | "warning" | "critical"): string {
  switch (level) {
    case "healthy":
      return "✅";
    case "warning":
      return "⚠️";
    case "critical":
      return "🔴";
  }
}

function formatChange(change: number): string {
  if (change === 0) return "→ 0";
  if (change > 0) return `↑ +${change}`;
  return `↓ ${change}`;
}

function formatChangeColor(change: number): string {
  if (change > 0) return "#22c55e"; // green
  if (change < 0) return "#ef4444"; // red
  return "#64748b"; // gray
}

export async function sendOwnerDigestEmail({
  to,
  data,
}: {
  to: string;
  data: OwnerDigestData;
}) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://wish-bubble.app";
    const periodTitle = data.period === "daily" ? "Daily Digest" : "Weekly Digest";

    // Build highlights HTML
    const highlightsHtml = data.highlights.length > 0
      ? `
        <div style="background: #fef3c7; border-radius: 12px; padding: 20px; margin-bottom: 30px; border-left: 4px solid #f59e0b;">
          <h3 style="margin: 0 0 15px 0; color: #92400e; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Highlights</h3>
          <ul style="margin: 0; padding-left: 20px; color: #78350f;">
            ${data.highlights.map((h) => `<li style="margin-bottom: 8px;">${h}</li>`).join("")}
          </ul>
        </div>
      `
      : "";

    const { error, data: emailData } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: `WishBubble ${periodTitle} - ${data.periodLabel}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc;">
            <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #0891b2 0%, #0e7490 100%); padding: 30px; color: white; text-align: center;">
                <h1 style="margin: 0 0 5px 0; font-size: 24px;">WishBubble</h1>
                <h2 style="margin: 0 0 10px 0; font-size: 20px; font-weight: normal; opacity: 0.9;">${periodTitle}</h2>
                <p style="margin: 0; opacity: 0.8; font-size: 14px;">${data.periodLabel}</p>
              </div>

              <div style="padding: 30px;">
                <!-- Health Section -->
                <div style="margin-bottom: 30px;">
                  <h3 style="margin: 0 0 15px 0; color: #1e293b; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">System Health</h3>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">
                        <span style="font-size: 18px;">${getHealthIndicator(data.health.system.level)}</span>
                        <span style="margin-left: 10px; color: #1e293b;">System</span>
                      </td>
                      <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: right; color: #64748b;">
                        ${data.health.system.label}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">
                        <span style="font-size: 18px;">${getHealthIndicator(data.health.email.level)}</span>
                        <span style="margin-left: 10px; color: #1e293b;">Email Delivery</span>
                      </td>
                      <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: right; color: #64748b;">
                        ${data.health.email.label}${data.health.email.failedCount > 0 ? ` (${data.health.email.failedCount} failed)` : ""}
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0;">
                        <span style="font-size: 18px;">${getHealthIndicator(data.health.contacts.level)}</span>
                        <span style="margin-left: 10px; color: #1e293b;">Contact Inbox</span>
                      </td>
                      <td style="padding: 10px 0; text-align: right; color: #64748b;">
                        ${data.health.contacts.unansweredCount > 0 ? `${data.health.contacts.unansweredCount} awaiting response` : "All caught up"}
                      </td>
                    </tr>
                  </table>
                </div>

                <!-- Growth Section -->
                <div style="margin-bottom: 30px;">
                  <h3 style="margin: 0 0 15px 0; color: #1e293b; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Growth Metrics</h3>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 12px; background: #f8fafc; border-radius: 8px 0 0 0;">
                        <div style="font-size: 24px; font-weight: bold; color: #0891b2;">${data.growth.users.total.toLocaleString()}</div>
                        <div style="font-size: 12px; color: #64748b;">Users</div>
                      </td>
                      <td style="padding: 12px; background: #f8fafc; border-radius: 0 8px 0 0; text-align: right;">
                        <span style="color: ${formatChangeColor(data.growth.users.change)}; font-weight: 600;">${formatChange(data.growth.users.change)}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px; background: white;">
                        <div style="font-size: 24px; font-weight: bold; color: #8b5cf6;">${data.growth.bubbles.total.toLocaleString()}</div>
                        <div style="font-size: 12px; color: #64748b;">Groups</div>
                      </td>
                      <td style="padding: 12px; background: white; text-align: right;">
                        <span style="color: ${formatChangeColor(data.growth.bubbles.change)}; font-weight: 600;">${formatChange(data.growth.bubbles.change)}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px; background: #f8fafc;">
                        <div style="font-size: 24px; font-weight: bold; color: #f59e0b;">${data.growth.items.total.toLocaleString()}</div>
                        <div style="font-size: 12px; color: #64748b;">Wishlist Items</div>
                      </td>
                      <td style="padding: 12px; background: #f8fafc; text-align: right;">
                        <span style="color: ${formatChangeColor(data.growth.items.change)}; font-weight: 600;">${formatChange(data.growth.items.change)}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px; background: white; border-radius: 0 0 0 8px;">
                        <div style="font-size: 24px; font-weight: bold; color: #22c55e;">${data.growth.claims.total.toLocaleString()}</div>
                        <div style="font-size: 12px; color: #64748b;">Gift Claims</div>
                      </td>
                      <td style="padding: 12px; background: white; border-radius: 0 0 8px 0; text-align: right;">
                        <span style="color: ${formatChangeColor(data.growth.claims.change)}; font-weight: 600;">${formatChange(data.growth.claims.change)}</span>
                      </td>
                    </tr>
                  </table>
                </div>

                <!-- Business Section -->
                <div style="margin-bottom: 30px;">
                  <h3 style="margin: 0 0 15px 0; color: #1e293b; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Business</h3>
                  <div style="display: flex; gap: 15px;">
                    <div style="flex: 1; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 12px; padding: 20px; color: white; text-align: center;">
                      <div style="font-size: 28px; font-weight: bold;">${data.business.mrr}</div>
                      <div style="font-size: 12px; opacity: 0.9;">Monthly Revenue</div>
                    </div>
                  </div>
                  <table style="width: 100%; margin-top: 15px; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 10px 0; color: #64748b;">Active Subscriptions</td>
                      <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #1e293b;">${data.business.activeSubscriptions}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; color: #64748b;">Conversion Rate</td>
                      <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #1e293b;">${data.business.conversionRate}%</td>
                    </tr>
                  </table>
                </div>

                <!-- Highlights Section -->
                ${highlightsHtml}

                <!-- CTA Button -->
                <div style="text-align: center; margin-top: 30px;">
                  <a href="${appUrl}/admin" style="display: inline-block; background: #0891b2; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                    View Admin Dashboard
                  </a>
                </div>
              </div>

              <!-- Footer -->
              <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                  This is an automated digest email from WishBubble.
                  <br>
                  <a href="${appUrl}/admin/settings" style="color: #0891b2;">Manage digest settings</a>
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      logger.error("Failed to send owner digest email", error, { to, period: data.period });
      return { success: false, error };
    }

    return { success: true, data: emailData };
  } catch (error) {
    logger.error("Email sending error", error, { type: "ownerDigest", to });
    return { success: false, error };
  }
}
