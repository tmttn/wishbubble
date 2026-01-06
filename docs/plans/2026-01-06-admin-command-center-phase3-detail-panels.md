# Phase 3: Detail Panels Implementation Plan

## Overview

Transform the admin portal from full-page navigation to slide-out contextual panels for viewing entity details without losing list context.

**Goal**: Click user/bubble/wishlist/item → panel slides from right (400-500px wide on desktop, full-screen on mobile) showing core details, related entities, and actions.

---

## Tasks

### Task 1: Create Base Detail Panel Component
**File**: `src/components/admin/detail-panel.tsx`

Create a responsive panel component that:
- Uses Sheet (slide from right) on desktop (≥768px)
- Uses Drawer (slide from bottom) on mobile (<768px)
- Provides sub-components: DetailPanelContent, DetailPanelHeader, DetailPanelTitle, DetailPanelDescription, DetailPanelBody, DetailPanelFooter

**Verification**: Component renders without errors, switches between Sheet/Drawer based on viewport.

---

### Task 2: Create User Detail Panel API Endpoint
**File**: `src/app/api/admin/users/[id]/panel/route.ts`

API endpoint returning optimized data for the panel view:
- User profile (name, email, avatar, tier, admin status)
- Recent bubble memberships (limit 10)
- Recent wishlists (limit 10)
- Recent claims (limit 5)
- Owned bubbles count (for delete validation)
- Suspension status

**Verification**: `GET /api/admin/users/{id}/panel` returns expected JSON structure.

---

### Task 3: Create User Detail Panel Component
**File**: `src/components/admin/user-detail-panel.tsx`

Panel content component showing:
- Header with avatar, name, email, badges (tier, admin)
- Meta info (joined date, last login)
- Suspension warning if applicable
- Groups list (clickable to navigate)
- Wishlists list
- Recent claims
- Admin actions (suspend/unsuspend, delete) - reuse existing UserActions component
- Footer with "View Full Profile" link

**Verification**: Panel loads user data via API and displays all sections.

---

### Task 4: Create Users List Client Component
**File**: `src/components/admin/users-list-client.tsx`

Client component wrapper for the users list that:
- Handles click events to open detail panel
- Preserves Ctrl/Cmd+click for new tab navigation
- Maintains panel state (open/closed, selected user)

**Verification**: Clicking user row opens panel instead of navigating.

---

### Task 5: Integrate User Panel into Users Page
**File**: `src/app/(admin)/admin/users/page.tsx`

Modify users page to:
- Use UsersListClient component for the user list
- Pass translated labels for the list

**Verification**: Users page shows panel on click, full page on Ctrl+click.

---

### Task 6: Create Bubble Detail Panel API Endpoint
**File**: `src/app/api/admin/groups/[id]/panel/route.ts`

API endpoint returning:
- Group details (name, occasion type, event date, visibility)
- Members list with roles (limit 10)
- Wishlists in group (limit 5)
- Recent activity (limit 10)
- Secret Santa status if applicable
- Archive status

**Verification**: API returns expected structure.

---

### Task 7: Create Bubble Detail Panel Component
**File**: `src/components/admin/bubble-detail-panel.tsx`

Panel content showing:
- Header with name, occasion type badge
- Event date and countdown
- Members list (clickable to open user panel)
- Wishlists in group
- Secret Santa draw status
- Admin actions (archive, delete)
- Footer with "View Full Details" link

**Verification**: Panel displays all bubble data.

---

### Task 8: Create Groups List Client Component & Integrate
**File**: `src/components/admin/groups-list-client.tsx`
**Modify**: `src/app/(admin)/admin/groups/page.tsx`

Same pattern as users - client wrapper handling panel state.

**Verification**: Groups page shows panel on click.

---

### Task 9: Create Wishlist Detail Panel
**Files**:
- `src/app/api/admin/wishlists/[id]/panel/route.ts`
- `src/components/admin/wishlist-detail-panel.tsx`
- `src/components/admin/wishlists-list-client.tsx`

Wishlist panel showing:
- Name, owner (clickable), default status
- Items count and list (limit 10)
- Shared in which bubbles
- Actions (delete)

**Verification**: Wishlists page shows panel on click.

---

### Task 10: Create Item Detail Panel
**Files**:
- `src/app/api/admin/items/[id]/panel/route.ts`
- `src/components/admin/item-detail-panel.tsx`
- `src/components/admin/items-list-client.tsx`

Item panel showing:
- Title, price, source URL
- Owner wishlist and user (clickable)
- Claim status (who claimed, in which bubble)
- Priority
- Actions (delete claim, delete item)

**Verification**: Items page shows panel on click.

---

### Task 11: Add Panel Navigation Between Entities

When in a panel, clicking a related entity should update the panel to show that entity:
- In User panel, clicking a bubble → shows Bubble panel
- In Bubble panel, clicking a member → shows User panel
- In Wishlist panel, clicking owner → shows User panel
- etc.

**Implementation**: Add `onNavigateToUser`, `onNavigateToBubble`, etc. callbacks to panel components.

**Verification**: Cross-entity navigation works within panels.

---

## File Structure After Implementation

```
src/components/admin/
├── detail-panel.tsx              # Base responsive panel
├── user-detail-panel.tsx         # User panel content
├── bubble-detail-panel.tsx       # Bubble panel content
├── wishlist-detail-panel.tsx     # Wishlist panel content
├── item-detail-panel.tsx         # Item panel content
├── users-list-client.tsx         # Users list with panel
├── groups-list-client.tsx        # Groups list with panel
├── wishlists-list-client.tsx     # Wishlists list with panel
└── items-list-client.tsx         # Items list with panel

src/app/api/admin/
├── users/[id]/panel/route.ts
├── groups/[id]/panel/route.ts
├── wishlists/[id]/panel/route.ts
└── items/[id]/panel/route.ts
```

---

## Technical Notes

- Panels use Sheet component (desktop) and Drawer component (mobile) based on `useMediaQuery`
- Panel width: `sm:max-w-md md:max-w-lg lg:max-w-xl` (responsive)
- Data fetched via dedicated `/panel` API endpoints for optimized payloads
- Ctrl/Cmd+click preserved for "open in new tab" behavior
- Existing full-page detail views remain as fallback/complete view
- Panel actions reuse existing action components (UserActions, etc.)

---

## Translations Required

Add to `messages/en.json` and `messages/nl.json`:
- `admin.panels.user.*` - User panel labels
- `admin.panels.bubble.*` - Bubble panel labels
- `admin.panels.wishlist.*` - Wishlist panel labels
- `admin.panels.item.*` - Item panel labels
- `admin.panels.common.*` - Shared labels (viewFull, loading, error)
