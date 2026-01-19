# Feedback Screenshot & Admin Impersonation

**Date:** 2026-01-19
**Status:** Approved

## Overview

Add screenshot capture to the feedback form and allow admins to impersonate users directly from support tickets.

## Features

1. **Screenshot checkbox** in feedback form - automatically captures page screenshot when checked
2. **Screenshot display** in admin ticket detail page
3. **Impersonate button** in admin ticket detail page to view app as the user

## Database Changes

Add two new fields to `ContactSubmission`:

```prisma
model ContactSubmission {
  // ... existing fields ...

  userId        String?   // Link to User who submitted (for logged-in feedback)
  screenshotUrl String?   // Vercel Blob URL for screenshot

  user          User?     @relation(fields: [userId], references: [id])
}
```

## Feedback Form Changes

- New checkbox below message field: "Include screenshot of current page"
- Unchecked by default (privacy-conscious)
- When checked: captures screenshot using `html2canvas`, uploads to Vercel Blob
- Loading state while capturing

## API Changes

### `/api/feedback/route.ts`
- Accept `screenshotUrl` in payload
- Store `userId` from session and `screenshotUrl` in database

### `/api/admin/contact/[id]/route.ts`
- Include `userId` and `screenshotUrl` in GET response

## Admin Detail Page Changes

### Screenshot Card
- New card in main content area (before Reply form)
- Shows thumbnail of screenshot
- Click to open full-size in new tab
- Only visible when screenshot exists

### Impersonate Button
- Located in sidebar Details card
- Calls existing `/api/admin/impersonate` endpoint
- Opens impersonation URL in new tab
- Only visible when userId exists

## Translations

New keys for both `en.json` and `nl.json`:
- `feedback.includeScreenshot`
- `feedback.screenshotHelp`
- `feedback.capturingScreenshot`
- `admin.contactPage.screenshot`
- `admin.contactPage.impersonateUser`
- `admin.contactPage.noUserLinked`

## Files to Modify

1. `prisma/schema.prisma`
2. `src/components/feedback/feedback-button.tsx`
3. `src/app/api/feedback/route.ts`
4. `src/app/api/admin/contact/[id]/route.ts`
5. `src/app/(admin)/admin/contact/[id]/page.tsx`
6. `messages/en.json`
7. `messages/nl.json`

## Dependencies

- `html2canvas` - for DOM screenshot capture
