import { Resend } from "resend";

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
              <h1 style="color: #6366f1; margin: 0;">WishBubble</h1>
            </div>

            <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 12px; padding: 30px; color: white; text-align: center; margin-bottom: 30px;">
              <h2 style="margin: 0 0 10px 0;">${t.heading}</h2>
              <p style="margin: 0; opacity: 0.9;">${t.subheading(inviterName)}</p>
            </div>

            <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
              <h3 style="margin: 0 0 10px 0; color: #1e293b;">${t.bubbleLabel} ${bubbleName}</h3>
              <p style="margin: 0; color: #64748b;">${t.description}</p>
            </div>

            <div style="text-align: center; margin-bottom: 30px;">
              <a href="${inviteUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
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
      console.error("Failed to send email:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Email sending error:", error);
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
              <h1 style="color: #6366f1; margin: 0;">WishBubble</h1>
            </div>

            <h2 style="text-align: center;">${t.heading}</h2>

            <p style="text-align: center; color: #64748b;">
              ${t.description}
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
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
      console.error("Failed to send verification email:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Email sending error:", error);
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
              <h1 style="color: #6366f1; margin: 0;">WishBubble</h1>
            </div>

            <h2 style="text-align: center;">${t.heading}</h2>

            <p style="text-align: center; color: #64748b;">
              ${t.description}
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
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
      console.error("Failed to send password reset email:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Email sending error:", error);
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
              <h1 style="color: #6366f1; margin: 0;">WishBubble</h1>
            </div>

            <h2 style="text-align: center;">${t.heading}</h2>

            <p style="text-align: center; color: #64748b;">
              ${t.description}
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
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
      console.error("Failed to send email change verification:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Email sending error:", error);
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
              <h1 style="color: #6366f1; margin: 0;">WishBubble</h1>
            </div>

            <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 12px; padding: 30px; color: white; text-align: center; margin-bottom: 30px;">
              <h2 style="margin: 0 0 10px 0;">${t.heading}</h2>
              <p style="margin: 0; opacity: 0.9;">${t.subheading(memberName)}</p>
            </div>

            <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
              <h3 style="margin: 0 0 10px 0; color: #1e293b;">${bubbleName}</h3>
              <p style="margin: 0; color: #64748b;">${t.description(memberName)}</p>
            </div>

            <div style="text-align: center; margin-bottom: 30px;">
              <a href="${bubbleUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                ${t.button}
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

            <p style="color: #94a3b8; font-size: 12px; text-align: center;">
              ${t.footer(bubbleName)}
              <br>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://wish-bubble.app"}/settings" style="color: #6366f1;">${t.manage}</a>
            </p>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("Failed to send member joined email:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Email sending error:", error);
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
              <h1 style="color: #6366f1; margin: 0;">WishBubble</h1>
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
              <a href="${bubbleUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
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
      console.error("Failed to send Secret Santa email:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Email sending error:", error);
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
              <h1 style="color: #6366f1; margin: 0;">WishBubble</h1>
            </div>

            <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 12px; padding: 30px; color: white; text-align: center; margin-bottom: 30px;">
              <h2 style="margin: 0 0 10px 0;">${t.heading}</h2>
              <p style="margin: 0; opacity: 0.9;">${t.subheading}</p>
            </div>

            <p style="margin-bottom: 20px;">${t.greeting(userName)}</p>

            <p style="margin-bottom: 20px;">${t.body(bubbleName)}</p>

            ${eventDateStr ? `<p style="margin-bottom: 20px; color: #64748b;">${t.eventNote(eventDateStr)}</p>` : ""}

            <div style="text-align: center; margin: 30px 0;">
              <a href="${bubbleUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                ${t.button}
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

            <p style="color: #94a3b8; font-size: 12px; text-align: center;">
              ${t.footer(bubbleName)}
              <br>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://wish-bubble.app"}/settings" style="color: #6366f1;">${t.manage}</a>
            </p>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("Failed to send wishlist reminder email:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Email sending error:", error);
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
              <h1 style="color: #6366f1; margin: 0;">WishBubble</h1>
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
              <a href="${bubbleUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                ${t.button}
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

            <p style="color: #94a3b8; font-size: 12px; text-align: center;">
              ${t.footer(bubbleName)}
              <br>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://wish-bubble.app"}/settings" style="color: #6366f1;">${t.manage}</a>
            </p>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("Failed to send event approaching email:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Email sending error:", error);
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
            <a href="${bubble.url}" style="color: #6366f1; font-size: 14px; text-decoration: none;">${t.viewBubble}</a>
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
              <h1 style="color: #6366f1; margin: 0;">WishBubble</h1>
            </div>

            <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 12px; padding: 30px; color: white; text-align: center; margin-bottom: 30px;">
              <h2 style="margin: 0 0 10px 0;">${t.heading}</h2>
              <p style="margin: 0; opacity: 0.9;">${t.subheading}</p>
            </div>

            <p style="margin-bottom: 20px;">${t.greeting(userName)}</p>

            <p style="margin-bottom: 20px;">${t.body}</p>

            ${bubblesHtml}

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://wish-bubble.app"}/bubbles" style="display: inline-block; background: #6366f1; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                ${t.button}
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

            <p style="color: #94a3b8; font-size: 12px; text-align: center;">
              ${t.footer}
              <br>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://wish-bubble.app"}/settings" style="color: #6366f1;">${t.manage}</a>
            </p>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error("Failed to send weekly digest email:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Email sending error:", error);
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
              <h1 style="color: #6366f1; margin: 0;">WishBubble Admin</h1>
            </div>

            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 12px; padding: 30px; color: white; text-align: center; margin-bottom: 30px;">
              <h2 style="margin: 0 0 10px 0;">New Contact Form Submission</h2>
              <p style="margin: 0; opacity: 0.9;">${subjectLabel}</p>
            </div>

            <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
              <p style="margin: 0 0 10px 0;"><strong>From:</strong> ${senderName}</p>
              <p style="margin: 0;"><strong>Email:</strong> <a href="mailto:${senderEmail}" style="color: #6366f1;">${senderEmail}</a></p>
            </div>

            <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
              <h3 style="margin: 0 0 10px 0; color: #1e293b;">Message:</h3>
              <p style="margin: 0; color: #64748b; white-space: pre-wrap;">${message}</p>
            </div>

            <div style="text-align: center; margin-bottom: 30px;">
              <a href="${adminUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
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
      console.error("Failed to send contact form notification:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Email sending error:", error);
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
              <h1 style="color: #6366f1; margin: 0;">WishBubble</h1>
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
      console.error("Failed to send contact reply:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Email sending error:", error);
    return { success: false, error };
  }
}
