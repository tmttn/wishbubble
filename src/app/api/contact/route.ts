import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ContactSubject } from "@prisma/client";
import { sendContactFormNotification } from "@/lib/email";
import { logger } from "@/lib/logger";

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
const RECAPTCHA_THRESHOLD = 0.5;

// Rate limiting: max 5 submissions per IP per hour
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 3600000 }); // 1 hour
    return true;
  }

  if (entry.count >= 5) {
    return false;
  }

  entry.count++;
  return true;
}

async function verifyRecaptcha(token: string): Promise<{ success: boolean; score?: number }> {
  if (!RECAPTCHA_SECRET_KEY) {
    console.warn("RECAPTCHA_SECRET_KEY not configured, skipping verification");
    return { success: true, score: 1.0 };
  }

  try {
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: RECAPTCHA_SECRET_KEY,
        response: token,
      }),
    });

    const data = await response.json();
    return { success: data.success && data.score >= RECAPTCHA_THRESHOLD, score: data.score };
  } catch (error) {
    logger.error("reCAPTCHA verification failed", error);
    return { success: false };
  }
}

const validSubjects: ContactSubject[] = [
  "PRIVACY_REQUEST",
  "DATA_DELETION",
  "DATA_EXPORT",
  "BUG_REPORT",
  "FEATURE_REQUEST",
  "GENERAL_INQUIRY",
  "OTHER",
];

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://wish-bubble.app";

async function notifyAdmins(submission: {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  // Get admin emails from env var (for bootstrapping)
  const adminEmailsFromEnv =
    process.env.ADMIN_EMAILS?.split(",").map((e) => e.trim().toLowerCase()) || [];

  // Get all admin users from database
  const dbAdmins = await prisma.user.findMany({
    where: { isAdmin: true, deletedAt: null },
    select: { id: true, email: true, notifyEmail: true },
  });

  // Also get users whose emails are in ADMIN_EMAILS env var
  const envAdmins =
    adminEmailsFromEnv.length > 0
      ? await prisma.user.findMany({
          where: {
            email: { in: adminEmailsFromEnv },
            deletedAt: null,
          },
          select: { id: true, email: true, notifyEmail: true },
        })
      : [];

  // Combine and dedupe admins
  const adminMap = new Map<string, { id: string; email: string; notifyEmail: boolean }>();
  [...dbAdmins, ...envAdmins].forEach((admin) => {
    adminMap.set(admin.id, admin);
  });
  const admins = Array.from(adminMap.values());

  logger.info("Found admins to notify", { adminCount: admins.length, submissionId: submission.id });

  if (admins.length === 0) {
    logger.critical("No admin users found to notify about contact form submission", undefined, {
      submissionId: submission.id,
      hint: "Configure ADMIN_EMAILS in environment or mark users as admins in database",
    });
    return;
  }

  const adminUrl = `${APP_URL}/admin/contact/${submission.id}`;

  // Create in-app notifications for all admins
  try {
    const result = await prisma.notification.createMany({
      data: admins.map((admin) => ({
        userId: admin.id,
        type: "SYSTEM" as const,
        title: "New Contact Form Submission",
        body: `${submission.name} submitted a contact form: ${submission.subject.replace(/_/g, " ").toLowerCase()}`,
        data: { submissionId: submission.id, url: `/admin/contact/${submission.id}` },
      })),
    });
    logger.info("Created in-app notifications", { count: result.count, submissionId: submission.id });
  } catch (error) {
    logger.error("Failed to create in-app notifications", error, { submissionId: submission.id });
  }

  // Send email notifications to admins who have email notifications enabled
  const adminsWithEmail = admins.filter((admin) => admin.notifyEmail);
  logger.info("Sending email to admins", { emailCount: adminsWithEmail.length, submissionId: submission.id });

  const emailResults = await Promise.allSettled(
    adminsWithEmail.map((admin) =>
      sendContactFormNotification({
        to: admin.email,
        submissionId: submission.id,
        senderName: submission.name,
        senderEmail: submission.email,
        subject: submission.subject,
        message: submission.message,
        adminUrl,
      })
    )
  );

  emailResults.forEach((result, index) => {
    if (result.status === "rejected") {
      logger.error("Failed to send admin email", result.reason, {
        adminEmail: adminsWithEmail[index].email,
        submissionId: submission.id,
      });
    } else {
      logger.info("Email sent to admin", {
        adminEmail: adminsWithEmail[index].email,
        submissionId: submission.id,
      });
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0].trim() || "unknown";
    const userAgent = request.headers.get("user-agent") || undefined;

    // Rate limiting
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { name, email, subject, message, recaptchaToken, locale } = body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Validate subject
    if (!validSubjects.includes(subject)) {
      return NextResponse.json(
        { error: "Invalid subject" },
        { status: 400 }
      );
    }

    // Validate message length
    if (message.length < 10 || message.length > 5000) {
      return NextResponse.json(
        { error: "Message must be between 10 and 5000 characters" },
        { status: 400 }
      );
    }

    // Validate name length
    if (name.length < 2 || name.length > 100) {
      return NextResponse.json(
        { error: "Name must be between 2 and 100 characters" },
        { status: 400 }
      );
    }

    // Verify reCAPTCHA
    if (!recaptchaToken) {
      return NextResponse.json(
        { error: "reCAPTCHA verification required" },
        { status: 400 }
      );
    }

    const recaptchaResult = await verifyRecaptcha(recaptchaToken);
    if (!recaptchaResult.success) {
      return NextResponse.json(
        { error: "reCAPTCHA verification failed. Please try again." },
        { status: 400 }
      );
    }

    // Create contact submission
    const submission = await prisma.contactSubmission.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        subject: subject as ContactSubject,
        message: message.trim(),
        locale: locale || "en",
        ipAddress: ip,
        userAgent,
        recaptchaScore: recaptchaResult.score,
      },
    });

    // Notify admins (must await in serverless environment)
    try {
      await notifyAdmins(submission);
    } catch (err) {
      logger.error("Failed to notify admins", err, { submissionId: submission.id });
      // Don't fail the request if notification fails
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error creating contact submission", error);
    return NextResponse.json(
      { error: "Failed to submit contact form" },
      { status: 500 }
    );
  }
}
