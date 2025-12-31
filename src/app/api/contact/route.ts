import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ContactSubject } from "@prisma/client";
import { sendContactFormNotification } from "@/lib/email";

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
    console.error("reCAPTCHA verification failed:", error);
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
  // Get all admin users
  const admins = await prisma.user.findMany({
    where: { isAdmin: true, deletedAt: null },
    select: { id: true, email: true, notifyEmail: true },
  });

  console.log(`[Contact] Found ${admins.length} admin(s) to notify`);

  if (admins.length === 0) {
    console.warn("No admin users found to notify about contact form submission");
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
    console.log(`[Contact] Created ${result.count} in-app notification(s)`);
  } catch (error) {
    console.error("[Contact] Failed to create in-app notifications:", error);
  }

  // Send email notifications to admins who have email notifications enabled
  const adminsWithEmail = admins.filter((admin) => admin.notifyEmail);
  console.log(`[Contact] Sending email to ${adminsWithEmail.length} admin(s)`);

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
      console.error(`[Contact] Failed to send email to ${adminsWithEmail[index].email}:`, result.reason);
    } else {
      console.log(`[Contact] Email sent to ${adminsWithEmail[index].email}`);
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
    const { name, email, subject, message, recaptchaToken } = body;

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
        ipAddress: ip,
        userAgent,
        recaptchaScore: recaptchaResult.score,
      },
    });

    // Notify admins (in background, don't block the response)
    notifyAdmins(submission).catch((err) =>
      console.error("Failed to notify admins:", err)
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating contact submission:", error);
    return NextResponse.json(
      { error: "Failed to submit contact form" },
      { status: 500 }
    );
  }
}
