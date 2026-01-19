# Product Feed Edit Panel Design

## Overview

Add the ability to edit existing product feeds via a slide-over detail panel that opens when clicking on a table row.

## User Problem

Currently, users cannot modify product feed settings (like priority) after creation. The only options are to toggle enabled/disabled or delete and recreate the provider.

## Solution

A slide-over drawer from the right side that displays:
1. Read-only information (type, product count, sync status, dates)
2. Action buttons (sync, import)
3. Editable form fields
4. Delete option

## Layout

```
┌─────────────────────────────────────────┐
│ Header: Provider Name          [X close]│
├─────────────────────────────────────────┤
│ READ-ONLY INFO                          │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│ │ Type    │ │Products │ │ Status  │    │
│ │ FEED    │ │ 12,345  │ │ Synced  │    │
│ └─────────┘ └─────────┘ └─────────┘    │
│ Provider ID: awin_coolblue              │
│ Created: Jan 15, 2026                   │
│ Last Synced: Jan 19, 2026 14:30         │
├─────────────────────────────────────────┤
│ ACTIONS                                 │
│ [🔄 Sync from URL] [📤 Import CSV]      │
├─────────────────────────────────────────┤
│ EDIT FORM                               │
│ Display Name: [_______________]         │
│ Priority:     [___] (0-100)             │
│ Feed URL:     [_______________]         │
│ URL Patterns: [_______________]         │
│ Affiliate Param: [____]                 │
│ Affiliate Code:  [____]                 │
│ Enabled: [toggle]                       │
├─────────────────────────────────────────┤
│ FOOTER                                  │
│ [🗑 Delete]              [Cancel] [Save]│
└─────────────────────────────────────────┘
```

## Behavior

### Opening the panel
- Click anywhere on a table row (except the enabled toggle and action buttons)
- Row has hover state to indicate clickability

### Editing workflow
- Form pre-populated with current values
- Save button only enabled when there are unsaved changes
- Save calls `PATCH /api/admin/product-feeds/[id]`
- Success: toast notification, panel stays open with updated data, table refreshes
- Error: toast with error message, form remains editable

### Actions within panel
- Sync button: shows progress inline, same as table sync
- Import: opens existing import dialog
- Delete: confirmation dialog, closes panel on confirm

### Closing
- X button, click outside, or Escape key
- If unsaved changes: "Discard changes?" confirmation

## Implementation

### New component
- `ProductFeedDetailSheet` - uses shadcn Sheet component
- Props: `provider`, `onClose`, `onUpdate`, `onDelete`
- Self-contained form state and dirty tracking

### Modifications to ProductFeedsPage
- Add `selectedProvider` state
- Add row click handler (exclude Switch and action buttons)
- Render sheet when provider selected

### No API changes needed
Existing PATCH endpoint supports all editable fields.

### Translations
Add keys under `admin.productFeeds.detailSheet`.

## Editable Fields

| Field | Type | Validation |
|-------|------|------------|
| name | string | 1-100 chars |
| priority | number | 0-100 |
| enabled | boolean | - |
| feedUrl | string | valid URL, nullable |
| affiliateCode | string | max 100 chars, nullable |
| affiliateParam | string | max 50 chars, nullable |
| urlPatterns | string | max 500 chars, nullable |

## Read-only Fields

- providerId
- type (FEED/REALTIME/SCRAPER)
- productCount
- syncStatus
- lastSynced
- createdAt
