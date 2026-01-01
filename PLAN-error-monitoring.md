# Error Monitoring & Debugging Improvement Plan

## Summary of Current State

Based on a full codebase analysis, here are the key findings:

### What's Working Well
- ✅ All API routes have try/catch blocks
- ✅ Zod validation on inputs
- ✅ Toast notifications via Sonner for user feedback
- ✅ Proper HTTP status codes (401, 403, 404, 500)
- ✅ Vercel Analytics and Google Analytics integrated

### Critical Gaps
- ❌ No error tracking service (Sentry, LogRocket, etc.)
- ❌ No React error boundaries
- ❌ Silent failures in 6+ locations (functions that return early without user feedback)
- ❌ Background email operations fail silently
- ❌ No structured logging
- ❌ No user-facing bug report mechanism

---

## Phase 1: Fix Silent Failures (Immediate)

**Goal:** Ensure every user action provides feedback, even on failure.

### 1.1 Add user feedback to early returns

**Files to fix:**

| File | Line | Current Code | Fix |
|------|------|--------------|-----|
| `src/app/(main)/wishlist/page.tsx` | 325 | `if (!currentWishlist) return;` | Show toast error |
| `src/app/(main)/wishlist/page.tsx` | 365 | `if (!editingItem) return;` | Show toast error |
| `src/app/api/contact/route.ts` | 105 | `if (admins.length === 0) { return; }` | Log error, return 500 |

### 1.2 Handle background email failures

**Files to fix:**
- `src/app/api/bubbles/[id]/route.ts` - Group deletion emails
- `src/app/api/bubbles/[id]/invite/route.ts` - Invitation emails
- `src/app/api/auth/register/route.ts` - Verification emails

**Pattern to implement:**
```typescript
// Instead of fire-and-forget:
sendEmail().catch(console.error);

// Use this pattern:
try {
  await sendEmail();
} catch (error) {
  console.error("Failed to send email:", error);
  // Log to monitoring service
  // Optionally: queue for retry
}
```

---

## Phase 2: Add Error Tracking (Sentry)

**Goal:** Capture and aggregate all errors automatically.

### 2.1 Install and configure Sentry

```bash
npx @sentry/wizard@latest -i nextjs
```

### 2.2 Configure for Next.js App Router

Create these files:
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`
- Update `next.config.ts` with Sentry plugin

### 2.3 Add custom error context

```typescript
Sentry.setUser({ id: session.user.id, email: session.user.email });
Sentry.setTag("page", "wishlist");
```

### 2.4 Track specific events

- Form submission failures
- API errors with request/response context
- Background job failures

---

## Phase 3: Add React Error Boundaries

**Goal:** Catch component crashes and show fallback UI.

### 3.1 Create global error boundary

Create `src/app/error.tsx`:
```typescript
'use client';

export default function Error({ error, reset }) {
  // Log to Sentry
  // Show user-friendly message
  // Provide reset button
}
```

### 3.2 Create page-level error boundaries

Add `error.tsx` to critical routes:
- `src/app/(main)/wishlist/error.tsx`
- `src/app/(main)/bubbles/error.tsx`
- `src/app/(main)/bubbles/[id]/error.tsx`

---

## Phase 4: Structured Logging

**Goal:** Create searchable, contextual logs.

### 4.1 Create logging utility

```typescript
// src/lib/logger.ts
export const logger = {
  error: (message: string, context: object) => {
    console.error(JSON.stringify({ level: 'error', message, ...context, timestamp: new Date() }));
    Sentry.captureException(new Error(message), { extra: context });
  },
  warn: (message: string, context: object) => { ... },
  info: (message: string, context: object) => { ... },
};
```

### 4.2 Replace console.error calls

Replace 50+ `console.error()` calls with structured `logger.error()` calls.

---

## Phase 5: User Feedback Mechanism

**Goal:** Let users report issues with context.

### 5.1 Add feedback button

Create a floating feedback button component that:
- Opens a modal with "Report a problem" form
- Auto-captures: URL, user ID, browser info, recent errors
- Sends to existing contact form API or dedicated endpoint

### 5.2 Show feedback prompt on errors

When an error toast is shown, include "Report this issue" link.

---

## Phase 6: Monitoring & Alerts

**Goal:** Proactive notification of issues.

### 6.1 Sentry alerts

Configure Sentry to alert on:
- New error types
- Error spike (>10x normal)
- Specific critical errors

### 6.2 Cron job monitoring

Add success/failure tracking for:
- `/api/cron/event-reminder`
- `/api/cron/post-event`
- `/api/cron/weekly-digest`
- `/api/cron/wishlist-reminder`

Options: Sentry Crons, Checkly, or simple webhook to Slack/Discord.

---

## Implementation Priority

| Phase | Effort | Impact | Priority |
|-------|--------|--------|----------|
| Phase 1: Fix Silent Failures | 2 hours | High | 🔴 Critical |
| Phase 2: Add Sentry | 2-3 hours | High | 🔴 Critical |
| Phase 3: Error Boundaries | 1-2 hours | Medium | 🟡 High |
| Phase 4: Structured Logging | 3-4 hours | Medium | 🟡 High |
| Phase 5: User Feedback | 2-3 hours | Medium | 🟢 Medium |
| Phase 6: Monitoring/Alerts | 1-2 hours | Medium | 🟢 Medium |

**Total estimated effort: 11-16 hours**

---

## Quick Wins (Can do today)

1. Add toast errors to the 3 silent return statements
2. Sign up for Sentry free tier
3. Run `npx @sentry/wizard@latest -i nextjs`
4. Create basic `error.tsx` for global error catching

---

## Files to Modify

### Silent Failures (Phase 1)
- `src/app/(main)/wishlist/page.tsx`
- `src/app/api/contact/route.ts`
- `src/app/api/bubbles/[id]/route.ts`
- `src/app/api/bubbles/[id]/invite/route.ts`
- `src/app/api/auth/register/route.ts`

### Sentry Integration (Phase 2)
- `next.config.ts`
- `sentry.client.config.ts` (new)
- `sentry.server.config.ts` (new)
- `sentry.edge.config.ts` (new)
- `src/instrumentation.ts` (new)

### Error Boundaries (Phase 3)
- `src/app/error.tsx` (new)
- `src/app/(main)/wishlist/error.tsx` (new)
- `src/app/(main)/bubbles/error.tsx` (new)
- `src/app/(main)/bubbles/[id]/error.tsx` (new)

### Logging (Phase 4)
- `src/lib/logger.ts` (new)
- All files with `console.error` (50+ files)

### User Feedback (Phase 5)
- `src/components/feedback-button.tsx` (new)
- `src/app/(main)/layout.tsx`
