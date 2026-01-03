import { defaultLocale, type Locale, locales } from "@/i18n/request";

/**
 * Get translated messages for a given locale (server-side only)
 */
export async function getMessages(locale: Locale) {
  return (await import(`../../messages/${locale}.json`)).default;
}

/**
 * Validate and normalize a locale string
 */
export function normalizeLocale(locale: string | null | undefined): Locale {
  return (locale && locales.includes(locale as Locale) ? locale : defaultLocale) as Locale;
}

/**
 * Get the localized default wishlist name
 */
export async function getDefaultWishlistName(locale: string | null | undefined): Promise<string> {
  const validLocale = normalizeLocale(locale);
  const messages = await getMessages(validLocale);
  return messages.wishlist?.defaultName || "My Wishlist";
}

/**
 * Determine locale from Accept-Language header
 */
export function getLocaleFromHeader(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;
  const preferred = acceptLanguage.split(",")[0].split("-")[0];
  return locales.includes(preferred as Locale) ? (preferred as Locale) : defaultLocale;
}

/**
 * Simple template interpolation for notification messages
 * Replaces {key} with values from the params object
 */
function interpolate(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    return params[key]?.toString() ?? `{${key}}`;
  });
}

/**
 * Notification message types
 */
export type NotificationMessageType =
  | "itemClaimed"
  | "wishlistReminder"
  | "wishlistShared"
  | "bubbleInvitation"
  | "secretSantaDrawn"
  | "eventApproaching"
  | "memberJoined"
  | "bubbleDeleted"
  | "eventCompleted"
  | "weeklyDigest"
  | "bubbleMessage"
  | "contactForm"
  | "feedback";

/**
 * Get localized notification content
 */
export async function getNotificationContent(
  locale: string | null | undefined,
  type: NotificationMessageType,
  params: Record<string, string | number> = {}
): Promise<{ title: string; body: string }> {
  const validLocale = normalizeLocale(locale);
  const messages = await getMessages(validLocale);

  const messageTemplates = messages.notifications?.messages?.[type];
  if (!messageTemplates) {
    // Fallback to English if message type not found
    const enMessages = await getMessages("en");
    const enTemplates = enMessages.notifications?.messages?.[type];
    if (!enTemplates) {
      return { title: type, body: "" };
    }
    return {
      title: interpolate(enTemplates.title, params),
      body: interpolate(enTemplates.body, params),
    };
  }

  return {
    title: interpolate(messageTemplates.title, params),
    body: interpolate(messageTemplates.body, params),
  };
}

/**
 * Get localized "Someone" fallback for when user name is not available
 */
export async function getSomeone(locale: string | null | undefined): Promise<string> {
  const validLocale = normalizeLocale(locale);
  const messages = await getMessages(validLocale);
  return messages.notifications?.messages?.someone || "Someone";
}

/**
 * Get localized "The owner" fallback
 */
export async function getTheOwner(locale: string | null | undefined): Promise<string> {
  const validLocale = normalizeLocale(locale);
  const messages = await getMessages(validLocale);
  return messages.notifications?.messages?.theOwner || "The owner";
}

/**
 * Get localized urgency text for event reminders
 */
export async function getEventUrgency(
  locale: string | null | undefined,
  daysUntil: number
): Promise<string> {
  const validLocale = normalizeLocale(locale);
  const messages = await getMessages(validLocale);

  if (daysUntil === 1) {
    return messages.notifications?.messages?.happeningTomorrow || "happening tomorrow";
  }
  return messages.notifications?.messages?.comingUpSoon || "coming up soon";
}
