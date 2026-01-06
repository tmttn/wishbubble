# Admin Command Center Design

## Overview

Redesign the WishBubble admin portal from a flat 16-item navigation into a unified command center optimized for:
- Daily health check-ins
- Reactive support tasks
- Business monitoring
- Mobile access

## Problems Addressed

| Problem | Solution |
|---------|----------|
| Flat navigation (16 items) | Grouped into 5 collapsible sections |
| Context switching between pages | Slide-out detail panels with related data |
| Lack of actionability | Actions directly in panels (impersonate, email, upgrade) |
| Visual overwhelm | Smart dashboard with health indicators and alerts |
| No mobile support | Responsive design prioritizing monitoring use case |
| No proactive updates | Owner-only digest email |

---

## Component Design

### 1. Grouped Navigation

Collapse 16 menu items into 5 logical groups:

```
🏠 Dashboard              (always visible)

📊 Inzichten
   ├─ Analytics
   └─ Activiteit Logs

👥 Gebruikers
   ├─ Alle Gebruikers
   ├─ Bubbles
   ├─ Verlanglijsten
   ├─ Items
   └─ Claims

💰 Business
   ├─ Financiën
   └─ Kortingscodes

📝 Content
   ├─ Cadeau Gidsen
   ├─ Aankondigingen
   └─ Product Feeds

⚙️ Systeem
   ├─ Notificatie Test
   ├─ E-mail Wachtrij
   └─ Contact Inbox
```

**Behavior:**
- Groups collapse/expand with state persisted to localStorage
- Current section auto-expands on navigation
- Mobile: hamburger menu with same structure

---

### 2. Smart Dashboard

Transform from raw stats display to morning check-in answering "Is everything okay? What needs attention?"

**Layout:**

```
┌─────────────────────────────────────────────────────────────────┐
│  Quick Actions Bar                                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌────────────┐ │
│  │ 🟢 Systeem  │ │ 📈 Vandaag  │ │ 💰 MRR      │ │ ⚠️ Actie   │ │
│  │ Gezond      │ │ +N users    │ │ €XX.XX      │ │ nodig (N)  │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └────────────┘ │
│                                                                 │
│  ┌─ Aandacht Nodig ─────────────────────────────────────────┐   │
│  │ Proactive alerts for items requiring action              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ Recente Activiteit ──────┐  ┌─ Snelle Stats (7d) ───────┐  │
│  │ Human-readable feed       │  │ Numbers with trends       │  │
│  └───────────────────────────┘  └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

**Health indicators derive from:**
- Email queue (failed count)
- Contact inbox (unanswered > 48h)
- System errors (if error tracking exists)
- Payment failures

**"Attention needed" alert types:**
- Failed emails in queue
- Unanswered contact messages
- Payment failures
- Low conversion rates (configurable threshold)
- Expiring trials

---

### 3. Quick Actions Bar

Always-visible toolbar at top of admin:

```
┌─────────────────────────────────────────────────────────────────┐
│ 🔍 Zoeken... (⌘K)     │ 👤 Impersonate ▼ │ ⚡ Simuleer ▼       │
└─────────────────────────────────────────────────────────────────┘
```

#### Global Search (⌘K)
- Searches: users, bubbles, wishlists, items, gift guides
- Results grouped by type
- Keyboard navigation (arrows + Enter)
- Opens detail panel or navigates to page

#### Impersonate
- Dropdown with user search
- Shows recent impersonations
- Opens app in new tab as selected user
- Red banner in app: "Bekijken als [User] [Stop]"
- Logs impersonation events in activity log

#### Simulate Events
Available event types:
- Payment succeeded
- Payment failed
- Item claimed
- Email send trigger
- Notification trigger
- Trial expiring

Flow: Select event → Choose target user → Confirm → Event fires through real system

---

### 4. Contextual Detail Panels

Slide-out panels that show related data without page navigation.

**Desktop behavior:**
- Click user/bubble/wishlist/item → panel slides from right (400-500px wide)
- List remains visible on left
- Panel shows: core details, related entities, recent activity, actions
- Press Esc or click outside to close
- Click nested item → panel updates (e.g., User → their Wishlist)

**Mobile behavior:**
- Tap row → full-screen detail view
- ← Terug button to return to list
- Same content as desktop panel

**Panel types:**

| Panel | Sections |
|-------|----------|
| User | Profile, Plan, Bubbles (list), Wishlists (list), Activity, Actions (impersonate, email, upgrade, delete) |
| Bubble | Details, Members (list), Wishlists (list), Claims (list), Event date, Actions |
| Wishlist | Details, Owner, Items (list), Shared in bubbles, Actions |
| Item | Details, Source URL, Owner, Claim status, Price, Actions |

---

### 5. Mobile Responsiveness

**Navigation:**
- Hamburger menu (☰) with collapsible groups
- Quick actions (Impersonate, Simulate) in menu

**Dashboard:**
- 2-column grid for status cards → stacks on narrow screens
- Attention alerts prioritized at top
- Condensed activity feed

**Lists:**
- Tables become card-based vertical lists
- Touch-friendly tap targets (min 44px)
- No hover-dependent interactions

**Detail views:**
- Full-screen instead of slide-out
- Swipe right to go back

---

### 6. Owner Digest Email

Daily or weekly email summary sent only to app owner.

**Configuration:**
```env
OWNER_EMAIL=thomas.metten@gmail.com
```

**Content:**
```
📊 WishBubble Owner Digest — [Period]

GEZONDHEID
✅/⚠️/🔴 System status
✅/⚠️/🔴 Email delivery status
⚠️ Pending contact messages

GROEI
👥 Users: N (+/-N this period)
🫧 Bubbles: N (+/-N)
🎁 Items: N (+/-N)
💳 Claims: N (+/-N)

BUSINESS
💰 MRR: €X.XX
📈/📉 Conversion: X%

HIGHLIGHTS
• Notable events from period

[Open Dashboard →]
```

**Settings (admin UI):**
- Frequency: Daily / Weekly / Off
- Delivery time: configurable (default 08:00)

**Logic:**
- Only sent to `OWNER_EMAIL` (not `ADMIN_EMAILS`)
- Skipped if no activity to report

---

## Implementation Phases

### Phase 1: Foundation
- [ ] Grouped sidebar navigation with collapse/expand
- [ ] Mobile hamburger menu
- [ ] Global search (⌘K) component
- [ ] Persist nav state to localStorage

### Phase 2: Smart Dashboard
- [ ] Health indicator cards with status derivation
- [ ] "Attention needed" alerts component
- [ ] Human-readable activity feed
- [ ] Stats with trend calculations
- [ ] Mobile-responsive dashboard layout

### Phase 3: Detail Panels
- [ ] Slide-out panel component (desktop)
- [ ] Full-screen detail view (mobile)
- [ ] User detail panel
- [ ] Bubble detail panel
- [ ] Wishlist detail panel
- [ ] Item detail panel
- [ ] Actions in panels (email, upgrade, delete)

### Phase 4: Power Features
- [ ] Impersonate user system
  - [ ] Session management
  - [ ] Red banner in app
  - [ ] Activity logging
- [ ] Simulate events system
  - [ ] Event type selection UI
  - [ ] Target user selection
  - [ ] Fire through real handlers
- [ ] Owner digest email
  - [ ] Email template
  - [ ] Cron job / scheduled function
  - [ ] Admin settings UI

---

## Out of Scope

- **Feature flags system** — Requires separate analysis of current codebase to determine which features could be flagged and implementation approach.

---

## Technical Notes

- Existing admin uses Next.js with a sidebar layout
- Detail panels can use existing UI patterns (likely shadcn/ui drawer or sheet component)
- Search should leverage existing database queries, possibly with a unified search endpoint
- Impersonation needs secure token generation and session management
- Digest email integrates with existing email infrastructure (transactional email provider)
