"use client";

/**
 * Client-side Analytics Utilities
 *
 * Lightweight event tracking for user interactions and journey progress.
 * Uses navigator.sendBeacon for non-blocking, fire-and-forget tracking.
 */

// Event categories
export const EVENT_CATEGORIES = {
  NAVIGATION: "navigation",
  FEATURE: "feature",
  CONVERSION: "conversion",
  ENGAGEMENT: "engagement",
  ERROR: "error",
} as const;

// Event actions
export const EVENT_ACTIONS = {
  VIEW: "view",
  PAGEVIEW: "pageview",
  CLICK: "click",
  SUBMIT: "submit",
  TOGGLE: "toggle",
  START: "start",
  COMPLETE: "complete",
  ABANDON: "abandon",
  SEARCH: "search",
  SHARE: "share",
  COPY: "copy",
  DOWNLOAD: "download",
} as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[keyof typeof EVENT_CATEGORIES];
export type EventAction = (typeof EVENT_ACTIONS)[keyof typeof EVENT_ACTIONS];

/**
 * Generate a unique session ID stored in sessionStorage
 */
const getSessionId = (): string => {
  if (typeof window === "undefined") return "";

  let sessionId = sessionStorage.getItem("wb_session_id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem("wb_session_id", sessionId);
  }
  return sessionId;
};

/**
 * Detect device type based on viewport width
 */
const getDeviceType = (): string => {
  if (typeof window === "undefined") return "unknown";
  const width = window.innerWidth;
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
};

/**
 * Check if analytics consent has been given
 */
const hasAnalyticsConsent = (): boolean => {
  if (typeof document === "undefined") return false;

  const cookies = document.cookie.split(";");
  const consentCookie = cookies.find((c) => c.trim().startsWith("cookie-consent="));

  if (!consentCookie) return true; // No consent decision yet, allow tracking

  try {
    const value = decodeURIComponent(consentCookie.split("=")[1]);
    const consent = JSON.parse(value);
    return consent.analytics === true;
  } catch {
    return true; // Invalid cookie, allow tracking
  }
};

export interface TrackEventParams {
  category: EventCategory | string;
  action: EventAction | string;
  label?: string;
  value?: number;
}

/**
 * Track an event (fire-and-forget)
 *
 * @example
 * ```ts
 * trackEvent({
 *   category: "conversion",
 *   action: "click",
 *   label: "upgrade_button",
 * });
 * ```
 */
export const trackEvent = (params: TrackEventParams): void => {
  if (typeof window === "undefined") return;
  if (!hasAnalyticsConsent()) return;

  try {
    const data = JSON.stringify({
      ...params,
      sessionId: getSessionId(),
      page: window.location.pathname,
      referrer: document.referrer || undefined,
      deviceType: getDeviceType(),
    });

    // Use sendBeacon for non-blocking requests
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/analytics/event", data);
    } else {
      // Fallback to fetch with keepalive
      fetch("/api/analytics/event", {
        method: "POST",
        body: data,
        headers: { "Content-Type": "application/json" },
        keepalive: true,
      }).catch(() => {
        // Silent fail
      });
    }
  } catch {
    // Silent fail - analytics should never break the app
  }
};

/**
 * Track a journey step (fire-and-forget)
 *
 * @example
 * ```ts
 * trackJourneyStep("onboarding", "first_bubble_created");
 * ```
 */
export const trackJourneyStep = (journeyType: string, step: string): void => {
  if (typeof window === "undefined") return;
  if (!hasAnalyticsConsent()) return;

  try {
    const data = JSON.stringify({
      journeyType,
      step,
      sessionId: getSessionId(),
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/analytics/journey", data);
    } else {
      fetch("/api/analytics/journey", {
        method: "POST",
        body: data,
        headers: { "Content-Type": "application/json" },
        keepalive: true,
      }).catch(() => {
        // Silent fail
      });
    }
  } catch {
    // Silent fail
  }
};

/**
 * Track a page view
 */
export const trackPageView = (path: string): void => {
  trackEvent({
    category: EVENT_CATEGORIES.NAVIGATION,
    action: EVENT_ACTIONS.PAGEVIEW,
    label: path,
  });
};

/**
 * Track a feature interaction
 */
export const trackFeature = (
  featureName: string,
  action: EventAction | string = EVENT_ACTIONS.VIEW,
  label?: string
): void => {
  trackEvent({
    category: EVENT_CATEGORIES.FEATURE,
    action,
    label: label ? `${featureName}:${label}` : featureName,
  });
};

/**
 * Track a conversion event
 */
export const trackConversion = (
  action: EventAction | string,
  label: string,
  value?: number
): void => {
  trackEvent({
    category: EVENT_CATEGORIES.CONVERSION,
    action,
    label,
    value,
  });
};

/**
 * Track an engagement event
 */
export const trackEngagement = (
  action: EventAction | string,
  label: string,
  value?: number
): void => {
  trackEvent({
    category: EVENT_CATEGORIES.ENGAGEMENT,
    action,
    label,
    value,
  });
};
