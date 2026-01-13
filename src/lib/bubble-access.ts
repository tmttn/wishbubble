import { prisma } from "@/lib/db";
import { createHash } from "crypto";
import { headers } from "next/headers";
import { createNotification } from "@/lib/notifications";
import { queueBubbleAccessAlert } from "@/lib/email/queue";
import { logger } from "@/lib/logger";

/**
 * Generate a device fingerprint from request headers
 * This creates a hash that's consistent for the same device but different across devices
 */
export async function getDeviceFingerprint(): Promise<string> {
  const headersList = await headers();

  // Collect device characteristics from headers
  const userAgent = headersList.get("user-agent") || "unknown";
  const acceptLanguage = headersList.get("accept-language") || "";
  const acceptEncoding = headersList.get("accept-encoding") || "";

  // Create a fingerprint string
  const fingerprintData = `${userAgent}|${acceptLanguage}|${acceptEncoding}`;

  // Hash it for privacy and consistency
  return createHash("sha256").update(fingerprintData).digest("hex").substring(0, 32);
}

/**
 * Parse User-Agent into a friendly device name
 */
export function getDeviceName(userAgent: string | null): string {
  if (!userAgent) return "Unknown device";

  // Detect browser
  let browser = "Unknown browser";
  if (userAgent.includes("Firefox/")) {
    browser = "Firefox";
  } else if (userAgent.includes("Edg/")) {
    browser = "Edge";
  } else if (userAgent.includes("Chrome/")) {
    browser = "Chrome";
  } else if (userAgent.includes("Safari/") && !userAgent.includes("Chrome")) {
    browser = "Safari";
  } else if (userAgent.includes("Opera/") || userAgent.includes("OPR/")) {
    browser = "Opera";
  }

  // Detect OS
  let os = "Unknown OS";
  if (userAgent.includes("iPhone")) {
    os = "iPhone";
  } else if (userAgent.includes("iPad")) {
    os = "iPad";
  } else if (userAgent.includes("Android")) {
    os = "Android";
  } else if (userAgent.includes("Mac OS X")) {
    os = "Mac";
  } else if (userAgent.includes("Windows")) {
    os = "Windows";
  } else if (userAgent.includes("Linux")) {
    os = "Linux";
  }

  return `${browser} on ${os}`;
}

/**
 * Get the client IP address from headers
 */
export async function getClientIp(): Promise<string | null> {
  const headersList = await headers();

  // Check common proxy headers
  const forwardedFor = headersList.get("x-forwarded-for");
  if (forwardedFor) {
    // Take the first IP if there are multiple
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = headersList.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  return null;
}

interface LogBubbleAccessOptions {
  bubbleId: string;
  userId: string;
  pinVerified?: boolean;
}

interface LogBubbleAccessResult {
  isNewDevice: boolean;
  accessLog: {
    id: string;
    deviceId: string;
    deviceName: string | null;
  };
}

/**
 * Log an access to a bubble and check if it's a new device
 */
export async function logBubbleAccess({
  bubbleId,
  userId,
  pinVerified = false,
}: LogBubbleAccessOptions): Promise<LogBubbleAccessResult> {
  const headersList = await headers();
  const userAgent = headersList.get("user-agent");

  const deviceId = await getDeviceFingerprint();
  const deviceName = getDeviceName(userAgent);
  const ipAddress = await getClientIp();

  // Check if this device has accessed this bubble before (for this user)
  const existingAccess = await prisma.bubbleAccessLog.findFirst({
    where: {
      bubbleId,
      userId,
      deviceId,
    },
  });

  const isNewDevice = !existingAccess;

  // Create the access log
  const accessLog = await prisma.bubbleAccessLog.create({
    data: {
      bubbleId,
      userId,
      deviceId,
      deviceName,
      ipAddress,
      pinVerified,
    },
  });

  return {
    isNewDevice,
    accessLog: {
      id: accessLog.id,
      deviceId: accessLog.deviceId,
      deviceName: accessLog.deviceName,
    },
  };
}

interface SendAccessAlertOptions {
  userId: string;
  bubbleId: string;
  bubbleName: string;
  deviceName: string | null;
  ipAddress: string | null;
}

/**
 * Send an access alert notification and email to the user
 */
export async function sendAccessAlert({
  userId,
  bubbleId,
  bubbleName,
  deviceName,
  ipAddress,
}: SendAccessAlertOptions): Promise<void> {
  try {
    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        notifyEmail: true,
        notifyInApp: true,
        locale: true,
      },
    });

    if (!user) return;

    const accessTime = new Date().toLocaleString(user.locale || "en", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    // Create in-app notification
    if (user.notifyInApp) {
      await createNotification({
        userId,
        type: "BUBBLE_ACCESSED",
        title: "New device access",
        body: `Your Secret Santa bubble "${bubbleName}" was accessed from ${deviceName || "an unknown device"}`,
        bubbleId,
        data: {
          deviceName,
          ipAddress,
          accessTime,
        },
      });
    }

    // Send email notification
    if (user.notifyEmail && user.email) {
      await queueBubbleAccessAlert({
        to: user.email,
        bubbleName,
        deviceName: deviceName || "Unknown device",
        ipAddress: ipAddress || "Unknown",
        accessTime,
        locale: user.locale || "en",
      });
    }
  } catch (error) {
    logger.error("Failed to send access alert", error, { userId, bubbleId });
  }
}

/**
 * Get recent access logs for a user's bubble
 */
export async function getUserBubbleAccessLogs(
  bubbleId: string,
  userId: string,
  limit: number = 10
) {
  return prisma.bubbleAccessLog.findMany({
    where: {
      bubbleId,
      userId,
    },
    orderBy: {
      accessedAt: "desc",
    },
    take: limit,
    select: {
      id: true,
      deviceId: true,
      deviceName: true,
      ipAddress: true,
      accessedAt: true,
      pinVerified: true,
    },
  });
}

/**
 * Check if a device is known for a user's bubble access
 */
export async function isKnownDevice(
  bubbleId: string,
  userId: string,
  deviceId: string
): Promise<boolean> {
  const existing = await prisma.bubbleAccessLog.findFirst({
    where: {
      bubbleId,
      userId,
      deviceId,
    },
  });

  return !!existing;
}
