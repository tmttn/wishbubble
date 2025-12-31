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
}: {
  to: string;
  inviterName: string;
  bubbleName: string;
  inviteUrl: string;
}) {
  try {
    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: `${inviterName} invited you to join "${bubbleName}" on WishBubble`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>You're Invited!</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #6366f1; margin: 0;">WishBubble</h1>
            </div>

            <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 12px; padding: 30px; color: white; text-align: center; margin-bottom: 30px;">
              <h2 style="margin: 0 0 10px 0;">You're Invited!</h2>
              <p style="margin: 0; opacity: 0.9;">${inviterName} wants you to join their gift exchange</p>
            </div>

            <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
              <h3 style="margin: 0 0 10px 0; color: #1e293b;">Bubble: ${bubbleName}</h3>
              <p style="margin: 0; color: #64748b;">
                Join this bubble to share your wishlist and see what others are hoping for.
                It's the perfect way to coordinate gifts!
              </p>
            </div>

            <div style="text-align: center; margin-bottom: 30px;">
              <a href="${inviteUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Accept Invitation
              </a>
            </div>

            <p style="color: #64748b; font-size: 14px; text-align: center;">
              This invitation link will expire in 7 days.
            </p>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

            <p style="color: #94a3b8; font-size: 12px; text-align: center;">
              If you didn't expect this invitation, you can safely ignore this email.
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
}: {
  to: string;
  verificationUrl: string;
}) {
  try {
    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Verify your WishBubble email",
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

            <h2 style="text-align: center;">Verify Your Email</h2>

            <p style="text-align: center; color: #64748b;">
              Click the button below to verify your email address and complete your registration.
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Verify Email
              </a>
            </div>

            <p style="color: #94a3b8; font-size: 12px; text-align: center;">
              If you didn't create an account, you can safely ignore this email.
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
}: {
  to: string;
  resetUrl: string;
}) {
  try {
    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Reset your WishBubble password",
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

            <h2 style="text-align: center;">Reset Your Password</h2>

            <p style="text-align: center; color: #64748b;">
              You requested a password reset for your WishBubble account. Click the button below to set a new password.
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Reset Password
              </a>
            </div>

            <p style="color: #64748b; font-size: 14px; text-align: center;">
              This link will expire in 1 hour.
            </p>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

            <p style="color: #94a3b8; font-size: 12px; text-align: center;">
              If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
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

export async function sendMemberJoinedNotification({
  to,
  memberName,
  bubbleName,
  bubbleUrl,
}: {
  to: string;
  memberName: string;
  bubbleName: string;
  bubbleUrl: string;
}) {
  try {
    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: `${memberName} joined "${bubbleName}" on WishBubble`,
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
              <h2 style="margin: 0 0 10px 0;">New Member Joined!</h2>
              <p style="margin: 0; opacity: 0.9;">${memberName} is now part of your group</p>
            </div>

            <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
              <h3 style="margin: 0 0 10px 0; color: #1e293b;">${bubbleName}</h3>
              <p style="margin: 0; color: #64748b;">
                ${memberName} has accepted the invitation and joined your bubble. They can now view wishlists and participate in the gift exchange!
              </p>
            </div>

            <div style="text-align: center; margin-bottom: 30px;">
              <a href="${bubbleUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                View Bubble
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">

            <p style="color: #94a3b8; font-size: 12px; text-align: center;">
              You're receiving this because you're a member of "${bubbleName}".
              <br>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://wish-bubble.app"}/settings" style="color: #6366f1;">Manage notification preferences</a>
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
}: {
  to: string;
  receiverName: string;
  bubbleName: string;
  bubbleUrl: string;
}) {
  try {
    const { data, error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Secret Santa Draw - ${bubbleName}`,
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
              <h2 style="margin: 0 0 10px 0;">The Secret Santa Draw is Complete!</h2>
              <p style="margin: 0; opacity: 0.9;">You're buying a gift for...</p>
            </div>

            <div style="background: #f8fafc; border-radius: 12px; padding: 30px; margin-bottom: 30px; text-align: center;">
              <h2 style="margin: 0; color: #1e293b; font-size: 28px;">${receiverName}</h2>
            </div>

            <p style="text-align: center; color: #64748b;">
              Check out their wishlist to find the perfect gift!
            </p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${bubbleUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                View Their Wishlist
              </a>
            </div>

            <p style="color: #94a3b8; font-size: 12px; text-align: center;">
              Remember: Keep it a secret!
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
