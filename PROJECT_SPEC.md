# WishBubble - Secret Santa Wishlist Platform



## Vision

A group-first wishlist platform designed for Secret Santa events and gift exchanges. Unlike traditional wishlist apps where you create a list and share it, WishBubble starts with the social aspect: create a "bubble" (group), invite participants, and coordinate gift-giving seamlessly.



---



## Core Differentiators



| Traditional Approach | WishBubble Approach |

|---------------------|---------------------|

| Create wishlist first | Create bubble (group) first |

| Share with individuals | Invite members to bubble |

| Everyone sees everything | Privacy-aware: owner doesn't see claims |

| Single-use lists | Reusable wishlists across bubbles |



---



## User Flows



### Flow 1: Create a Bubble (Event Organizer)

1. Sign up / Log in

2. Create new bubble (name, occasion, date, description)

3. Configure bubble settings (Secret Santa draw, budget limits, etc.)

4. Invite participants via email

5. Optionally: trigger Secret Santa name draw



### Flow 2: Join a Bubble (Participant)

1. Receive email invitation

2. Click link → Sign up / Log in

3. Join the bubble automatically

4. Create/attach wishlist to this bubble

5. View other participants' wishlists (with claim capability)



### Flow 3: Wishlist Management

1. Create wishlist items (title, description, price, link, image, priority)

2. Attach wishlist to one or more bubbles

3. See your own items (but NOT claim status)

4. Edit/remove items anytime



### Flow 4: Gift Coordination (Other Participants)

1. Browse member wishlists in a bubble

2. See which items are: Available / Claimed / Purchased

3. Claim an item → marked for others, hidden from owner

4. Mark as purchased when bought

5. Unclaim if plans change



---



## Feature Specification



### Authentication & Users

- [x] Email/password registration
- [x] OAuth (Google)
- [ ] OAuth (Apple, Facebook)
- [x] Email verification (on registration + resend)
- [x] Password reset flow
- [x] User profile (name, avatar, notification preferences)
- [x] Account deletion (GDPR compliance)
- [x] Last login tracking
- [x] JWT session strategy with NextAuth v5



### Groups (formerly Bubbles)

- [x] Create group with name, occasion type, date, description
- [x] Group settings:
    - [x] Budget range (min/max gift value)
    - [x] Secret Santa mode (random assignment)
    - [ ] Allow external wishlists (schema field exists, not enforced)
    - [x] Public/private visibility
    - [x] Currency selection
    - [x] Member limits
    - [x] Theme customization (color, cover image)
- [x] Invite members via email
- [x] Invitation link (shareable URL with token)
- [x] Invitation expiry (7 days)
- [x] Member management (remove members, transfer ownership, leave group, role changes)
- [ ] Bubble chat/comments
- [x] Event countdown
- [x] Member roles (Owner, Admin, Member)
- [x] Activity tracking/audit log
- [x] Archive functionality (manual + auto-archive after event)
- [x] Post-event gift summary modal (confetti celebration, gifts given/received)
- [x] Reveal givers setting (show/hide who gave gifts after event)
- [x] Cron job for post-event processing (daily at 8 AM UTC)
- [x] 8 occasion types (Christmas, Birthday, Sinterklaas, Wedding, Baby Shower, Graduation, Housewarming, Other)



### Wishlists

- [x] Create wishlist items:
    - [x] Title (required)
    - [x] Description
    - [x] Price / Price range (priceMax field)
    - [x] URL to product
    - [x] Image URL
    - [x] Image upload (Vercel Blob storage, drag-and-drop UI)
    - [x] Priority (must-have, nice-to-have, dream)
    - [x] Quantity (for items you want multiples of)
    - [x] Notes for gifters
    - [x] Category field
    - [x] Sort order field
- [x] Auto-scrape product info from URL (with Bol.com API integration)
- [x] Categorize items (field exists)
- [x] Reorder items (drag & drop UI)
- [x] Attach wishlist to multiple groups
- [ ] Wishlist templates (birthday, christmas, etc.)
- [x] Default wishlist auto-creation per user
- [x] Multiple wishlists per user
- [x] Soft delete for items



### Claim System (The Secret Sauce) ✅ COMPLETE

- [x] Claim item → reserves it for you
- [x] Claim visible to all EXCEPT wishlist owner
- [x] Mark as purchased
- [x] Unclaim functionality
- [x] Claim expiration (7 days default, auto-release)
- [x] Partial claims (quantity support)
- [x] Group gift support (isGroupGift, contribution fields)
- [x] Claim history tracking (claimedAt, purchasedAt, unclaimedAt)
- [x] Activity logging for claim actions
- [x] Prevents self-claims and duplicate claims
- [x] Over-claim validation



### Secret Santa Features

- [x] Random name draw within group (Fisher-Yates shuffle)
- [x] Derangement logic (no self-draws)
- [x] Exclusion rules (couples shouldn't draw each other)
- [x] Bidirectional exclusions support
- [x] Reveal assigned person privately
- [x] Email notification with receiver info
- [x] Assignment viewing with viewedAt tracking
- [x] Minimum 3 members validation
- [x] Admin-only draw trigger (Owner/Admin)
- [ ] Optional: set draw date
- [x] Redraw capability (admin) - DELETE endpoint + UI button for owner/admin



### Notifications

- [x] Email notifications:
    - [x] Group invitation
    - [x] Someone joined your group (respects emailOnMemberJoined preference)
    - [x] Reminder to add wishlist (cron job, respects emailOnWishlistReminder preference)
    - [x] Event approaching reminder (1 day and 7 days before, respects emailOnEventReminder preference)
    - [x] Secret Santa draw completed
    - [x] Weekly digest of group activity (respects notifyDigest + digestDay preferences)
- [x] Email service integration (Resend)
- [x] Professional HTML email templates
- [x] In-app notification center:
    - [x] Notification bell with unread count badge
    - [x] Dropdown with recent notifications
    - [x] Full notifications page (/notifications)
    - [x] Mark as read (single and all)
    - [x] Delete notifications
    - [x] Auto-polling for new notifications
    - [x] Click-to-navigate to related content
- [x] In-app notification triggers:
    - [x] Member joined group
    - [x] Secret Santa draw completed
    - [x] Event completed (post-event summary available)
    - [x] Item claimed (notifies other members, excludes item owner for surprise)
    - [x] Wishlist shared to group (notifies other members)
    - [x] Bubble invitation (for existing users)
- [ ] Push notifications (PWA configured but not implemented)
- [ ] Notification preferences per group
- [x] User notification preferences (notifyEmail, notifyInApp, notifyDigest)
- [x] Notifications respect user settings (notifyInApp toggle)
- [x] Digest day selection (day of week)
- [x] Notification model with types (schema ready)
- [x] Localized email notifications (EN/NL based on user's locale preference)
- [x] Locale-aware date formatting in emails
- [x] User locale persistence (saved to database + cookie)



### Admin Dashboard ✅ COMPLETE

- [x] User management (search, view details, pagination)
- [x] Group oversight (search, view details, member lists)
- [x] Items management (search, view claims)
- [x] Claims management (filter by status, view details)
- [x] Activity logs (filter by type, paginated)
- [x] System statistics:
    - [x] Total users, groups, items, claims
    - [x] Growth charts (users, groups, items, claims over time)
    - [x] Configurable time periods (7d, 30d, 90d, 1y, 2y, all)
    - [x] Year-over-Year (YoY) comparison
    - [x] Period totals with YoY percentage change
    - [x] Auto-granularity (daily/weekly/monthly based on period)
- [x] Full clickthrough navigation between entities
- [x] Feature flags (schema ready, no UI)
- [x] User suspension/deletion:
    - [x] Suspend users (with reason and duration options)
    - [x] Auto-unsuspend when duration expires
    - [x] Admin delete with Stripe subscription cancellation
    - [x] Email notifications for suspension/termination
    - [x] Protection for admin accounts
- [ ] Email campaign management
- [x] Announcement system:
    - [x] Create/edit/delete announcements (admin)
    - [x] JSON bulk import with preview
    - [x] Bilingual content (EN/NL)
    - [x] Target by subscription tier
    - [x] Scheduling (publish date, expiry)
    - [x] Release notes feature (public page)
    - [x] User dismissal tracking
    - [x] Modal display on login
    - [x] "What's New" page for logged-in users

### Contact Form & Support ✅ COMPLETE

- [x] Public contact form with subject categories
- [x] reCAPTCHA v3 spam protection
- [x] Rate limiting (5 submissions per IP per hour)
- [x] Admin contact management:
    - [x] View all submissions with status filtering
    - [x] Status workflow (New → In Progress → Resolved/Spam)
    - [x] In-app reply (sends email, no external mail client needed)
    - [x] Internal notes system (activity log)
    - [x] Localized reply emails (Dutch/English based on user's locale)
- [x] Admin notifications:
    - [x] Email notifications for new submissions
    - [x] In-app notifications with link to submission
    - [x] Support for ADMIN_EMAILS env var for bootstrapping

### Monetization & Subscriptions ✅ COMPLETE

**Pricing Tiers:**
| | Free | Premium | Family (Coming Soon) |
|---|---|---|---|
| Price | €0 | €4.99/mo or €39.99/yr | €9.99/mo or €79.99/yr |
| Groups you can own | 2 | 10 | 10 |
| Members per group | 8 | 25 | 50 |
| Wishlists | 3 | Unlimited | Unlimited |
| Items per wishlist | 4 | Unlimited | Unlimited |
| Secret Santa | No | Yes | Yes |
| Premium avatar badge | No | Yes | Yes |
| Ad-free experience | No | Yes | Yes |
| Share with family | No | No | Up to 5 members |
| Join others' groups | Unlimited | Unlimited | Unlimited |

**Features:**
- [x] Stripe integration for payments
- [x] Checkout flow with trial support (14-day free trial)
- [x] Customer portal for subscription management
- [x] Webhook handling for subscription events
- [x] Plan limit enforcement in API and UI
- [x] Pricing page with plan comparison
- [x] Billing settings page with usage stats
- [x] Coupon/discount code system:
    - [x] Admin coupon management UI
    - [x] Percentage and fixed amount discounts
    - [x] Duration options (once, repeating, forever)
    - [x] Redemption limits and expiration
    - [x] Stripe coupon sync
- [x] Financial dashboard for admins:
    - [x] MRR/ARR metrics
    - [x] Subscription breakdown by tier
    - [x] Revenue tracking
    - [x] Transaction history
    - [x] Trial conversion rates
    - [x] Churn rate monitoring
- [x] Upgrade prompts when hitting limits (CTAs on wishlist and bubbles pages)
- [x] Premium avatar badge (crown icon on premium user avatars)
- [x] Limit indicators for free users (progress bars showing usage)
- [x] Group creation blocking when limit reached
- [x] Member limit enforcement per group (based on owner's plan)
- [x] Member limit display in group UI and invite page
- [ ] Family plan with sharing (future)

### Internationalization (i18n) ✅ COMPLETE

- [x] next-intl integration
- [x] English (en) translations
- [x] Dutch (nl) translations
- [x] Locale detection (cookies + Accept-Language)
- [x] Server-side rendering support
- [x] Comprehensive translation coverage:
    - Navigation, auth, groups, wishlists, settings
    - Marketing copy, toast messages, errors
    - Occasion types, priority levels, days of week



### Analytics & Tracking ✅ MOSTLY COMPLETE

- [x] Page views, sessions (Vercel Analytics)
- [x] Error tracking (Sentry with source maps, session replay)
- [x] Performance monitoring (Sentry Web Vitals + Vercel Analytics)
- [x] Cookie consent (GDPR-compliant, analytics disabled until opt-in)
- [x] User journey tracking (funnels, user flows) - Custom UserJourney model with predefined funnels
- [x] Feature usage metrics (UserEvent tracking with admin dashboard)
- [x] Admin analytics dashboard (/admin/analytics)
- [ ] A/B testing framework



---



## Tech Stack (Implemented)

### Frontend
```
Framework:      Next.js 16.1 (App Router)
Language:       TypeScript 5
Styling:        Tailwind CSS 4 + shadcn/ui (Radix UI primitives)
State:          Zustand 5 (client) + TanStack React Query 5 (server)
Forms:          React Hook Form 7 + Zod 4
Charts:         Recharts 3 (admin analytics)
i18n:           next-intl 4 (English + Dutch)
PWA:            next-pwa 5 (configured, not fully implemented)
Animations:     Canvas Confetti (celebration effects)
Toasts:         Sonner 2 (toast notifications)
Theming:        next-themes 0.4
```

**Why Next.js?**
- SSR/SSG for SEO (important for organic growth)
- API routes for serverless backend
- Excellent developer experience
- Vercel deployment is seamless
- Built-in image optimization

### Backend
```
Runtime:        Node.js 20+ (via Next.js API routes)
Database:       PostgreSQL (managed)
ORM:            Prisma 7
Auth:           NextAuth.js v5 beta (JWT sessions)
Email:          Resend 6
Payments:       Stripe 20 (subscriptions + billing)
Error Tracking: Sentry 10
Analytics:      Vercel Analytics
```



**Why PostgreSQL?**

- Relational data (users, bubbles, items, claims)

- ACID compliance for claim transactions

- Excellent tooling (Prisma, Supabase)



### Infrastructure (Current)
```
Hosting:        Vercel (frontend + serverless functions)
Database:       PostgreSQL (managed)
CDN:            Vercel Edge Network
Monitoring:     Sentry (error tracking + cron monitoring)
Analytics:      Vercel Analytics
Ads:            Google AdSense (for free tier)
Cron Jobs:      Vercel Cron (4 scheduled tasks)
```

### Key Integrations
```
Payments:       Stripe (production-connected)
Email:          Resend (transactional emails)
CAPTCHA:        Google reCAPTCHA v3 (spam protection)
Product Data:   Bol.com API (Netherlands affiliate)
```



---



## Database Schema (High-Level)



```

┌─────────────┐     ┌─────────────┐     ┌─────────────┐

│   User      │────<│ BubbleMember│>────│   Bubble    │

└─────────────┘     └─────────────┘     └─────────────┘

       │                   │                   │

       │                   │                   │

       ▼                   ▼                   │

┌─────────────┐     ┌─────────────┐           │

│  Wishlist   │────<│WishlistItem │           │

└─────────────┘     └─────────────┘           │

                          │                   │

                          ▼                   │

                    ┌─────────────┐           │

                    │   Claim     │           │

                    └─────────────┘           │

                                              │

                    ┌─────────────┐           │

                    │SecretSanta  │───────────┘

                    │  Draw       │

                    └─────────────┘

```



---



## Monetization Strategy

> **Note:** See "Monetization & Subscriptions" section above for actual implemented pricing. The tiers below reflect the current implementation.

### Tier 1: Free
- Create up to 2 groups (up to 8 members each)
- 3 wishlists with up to 4 items each
- Basic email notifications
- Join unlimited groups owned by others
- **Ad-supported** (banner ads, non-intrusive)

### Tier 2: Premium (€4.99/month or €39.99/year, ~33% savings)
- Create up to 10 groups (up to 25 members each)
- Unlimited wishlists and items
- **Secret Santa feature** (exclusive)
- **Ad-free experience**
- Premium avatar badge (crown icon)
- Priority email support
- 14-day free trial

### Tier 3: Family (€9.99/month or €79.99/year) - Coming Soon
- Everything in Premium
- Up to 50 members per group
- Share subscription with up to 5 family members
- Dedicated support



### Additional Revenue Streams



#### 1. Google AdSense

- Banner ads on free tier

- Placement: Below wishlist, sidebar

- Estimated: $2-5 RPM (revenue per 1000 impressions)



#### 2. Affiliate Links

- Partner with major retailers (Amazon, Bol.com, etc.)

- Auto-convert product links to affiliate links

- 1-8% commission on purchases

- **High potential** given direct purchase intent



#### 3. Sponsored Gift Suggestions

- "Trending gifts" section with sponsored products

- Partner with gift retailers

- Native advertising format



#### 4. White-Label / B2B

- Corporate Secret Santa solution

- Custom branding for companies

- SSO integration

- $500-2000/year per company



### Revenue Projections (Conservative)

| Metric | Year 1 | Year 2 | Year 3 |
|--------|--------|--------|--------|
| Monthly Active Users | 5,000 | 25,000 | 100,000 |
| Premium Conversion | 2% | 3% | 4% |
| Premium Revenue (€4.99/mo) | €6,000 | €45,000 | €240,000 |
| Ad Revenue | €1,200 | €6,000 | €24,000 |
| Affiliate Revenue | €2,400 | €18,000 | €96,000 |
| **Total Annual** | **€9,600** | **€69,000** | **€360,000** |



---



## Hosting & Cost Breakdown

### Current Setup (Production)
| Service | Cost/month |
|---------|-----------|
| Vercel (Pro) | $20 |
| PostgreSQL (managed) | $25-50 |
| Resend (Pro) | $20 |
| Sentry (Team) | $26 |
| Domain | ~$1/month |
| **Total** | ~$92-117/month |

### Growth Phase (10k-100k users)
| Service | Cost/month |
|---------|-----------|
| Vercel (Pro) | $20 + usage |
| PostgreSQL (scaled) | $50-150 |
| Resend (scaled) | $50-100 |
| Sentry (Team) | $26+ |
| **Total** | ~$150-300/month |



---



## Implementation Phases



### Phase 1: MVP ✅ COMPLETE

- [x] User authentication (email/password + Google OAuth)
- [x] Create/join groups
- [x] Basic wishlist CRUD
- [x] Claim system (fully featured)
- [x] Email invitations
- [x] Basic responsive UI
- [x] i18n (English + Dutch)



### Phase 2: Core Features ✅ MOSTLY COMPLETE

- [x] Secret Santa draw
- [x] URL scraping for products (Bol.com API + Open Graph)
- [x] Email notification system (partial)
- [x] User profiles
- [x] Group settings



### Phase 3: Polish & Launch ✅ MOSTLY COMPLETE

- [x] Admin dashboard (complete with analytics, YoY comparison)
- [x] Analytics integration (custom UserEvent/UserJourney tracking with admin dashboard)
- [x] Google AdSense integration (with ad-free for Premium users)
- [x] Performance optimization (N+1 query fixes, database indexes)
- [x] SEO optimization (meta tags, sitemap, JSON-LD structured data)
- [x] Beta testing program (opt-in with feature flags)
- [x] Email verification flow
- [x] Password reset flow



### Phase 4: Growth Features ✅ MOSTLY COMPLETE

- [x] Premium tier implementation
- [x] Stripe payment integration (production connected)
- [x] Premium avatar badge for subscribers
- [x] Limit enforcement with upgrade CTAs
- [x] Affiliate link integration (Bol.com, configurable per provider)
- [ ] Mobile app (React Native or PWA)
- [ ] API for integrations
- [ ] Advanced features based on feedback



---



## Security Considerations

- [x] Application-level access control (users only see their data via API checks)
- [x] Rate limiting on auth routes and contact form (in-memory, with admin notifications)
- [x] SQL injection prevention (via Prisma parameterized queries)
- [x] Secure claim visibility (critical!) - separate API logic ensures owners never see claims
- [x] GDPR compliance (EU users) - privacy policy, data export, data deletion, contact form
- [x] Secure password hashing (bcryptjs)
- [x] JWT-based sessions (NextAuth.js v5)
- [x] reCAPTCHA v3 spam protection (contact form)
- [x] Input validation with Zod schemas
- [x] XSS prevention (React's default escaping)
- [x] CSRF protection (NextAuth.js built-in for auth routes)
- [x] Custom security headers (Content-Security-Policy, HSTS, X-Frame-Options, etc.)
- [ ] Environment variable validation at startup
- [ ] Row-level security in database (Prisma handles at app level)
- [ ] Data encryption at rest
- [ ] Regular security audits



---



## Key Technical Challenges



### 1. Claim Visibility Logic

The claim system is the **most critical** feature. Must ensure:

- Owner NEVER sees claim status via any API endpoint

- No client-side leaks (network tab, etc.)

- Separate API routes for owner vs. viewer



### 2. Real-time Updates

When someone claims an item, others should see immediately:

- WebSocket connection (Supabase Realtime)

- Or polling with smart caching



### 3. URL Scraping

Extracting product info from URLs:

- Open Graph meta tags

- Schema.org markup

- Custom scrapers per major retailer

- Rate limiting to avoid blocks



---



## Success Metrics



### User Engagement

- Daily/Monthly Active Users (DAU/MAU)

- Bubbles created per user

- Items per wishlist

- Claim rate

- Return visits



### Business Metrics

- User acquisition cost (CAC)

- Lifetime value (LTV)

- Premium conversion rate

- Churn rate

- Revenue per user



### Technical Metrics

- Page load time (<2s)

- API response time (<200ms)

- Uptime (99.9%)

- Error rate (<0.1%)



---



## Next Steps (Completed)

1. ~~**Validate concept** - Quick landing page to gauge interest~~ ✅
2. ~~**Design system** - Create Figma mockups~~ ✅
3. ~~**Setup project** - Initialize Next.js + Supabase~~ ✅
4. ~~**Build MVP** - Focus on core loop first~~ ✅
5. **Beta launch** - Friends & family testing ← **YOU ARE HERE**
6. **Iterate** - Based on feedback
7. **Public launch** - Marketing push

---

## Recommended Next Priorities

### High Priority (Pre-Launch Essentials)
1. ~~**Email verification flow** - Critical for account security~~ ✅ Complete
2. ~~**Password reset flow** - Users will need this~~ ✅ Complete
3. ~~**Member management** - Group owners need to manage members~~ ✅ Complete
4. ~~**In-app notification center** - Display existing notifications~~ ✅ Complete

### Medium Priority (Polish)
5. ~~**URL scraping for products** - Schema ready, improves UX significantly~~ ✅ Complete (with Bol.com affiliate integration)
6. ~~**Event countdown** - Good for engagement~~ ✅ Complete
7. ~~**Drag & drop reordering** - Better wishlist management~~ ✅ Complete
8. ~~**"Someone joined" email notification** - Keep owners informed~~ ✅ Complete
9. ~~**Comprehensive notification emails** - Wishlist reminder, event reminder, weekly digest~~ ✅ Complete
10. ~~**Localized emails** - All emails support EN/NL based on user preference~~ ✅ Complete
11. ~~**More in-app notification triggers** - Item claimed, wishlist added, etc.~~ ✅ Complete

### Lower Priority (Growth Phase)
12. ~~**Admin dashboard** - Monitor platform usage~~ ✅ Complete
13. ~~**Analytics integration** - Track user behavior~~ ✅ Complete (custom analytics with admin dashboard)
14. ~~**Premium tier + Stripe** - Monetization~~ ✅ Complete
15. ~~**Push notifications** - PWA with service worker~~ ✅ Complete

### Quick Wins
- ~~Contact form with admin management~~ ✅ Complete
- ~~Rate limiting on auth routes~~ ✅ Complete
- ~~Upgrade prompts when hitting plan limits~~ ✅ Complete
- ~~Premium avatar badge~~ ✅ Complete
- ~~"Someone joined" email notification~~ ✅ Complete
- ~~Redraw capability for Secret Santa~~ ✅ Complete
- ~~Member limit enforcement~~ ✅ Complete
- ~~Add image upload~~ ✅ Complete (Vercel Blob with drag-and-drop)

### Suggested Next Priorities

**Completed Since Last Review:**
1. ~~**Image upload for wishlist items**~~ ✅ Complete (Vercel Blob with drag-and-drop)
2. ~~**Push notifications**~~ ✅ Complete (service worker with subscription)
3. ~~**Bubble chat/comments**~~ ✅ Complete (text messaging within groups)
4. ~~**Security headers**~~ ✅ Complete (CSP, HSTS, X-Frame-Options, etc.)
5. ~~**Beta testing program**~~ ✅ Complete (opt-in with feature flags)
6. ~~**User journey tracking**~~ ✅ Complete (custom UserJourney model with admin dashboard)
7. ~~**Feature usage metrics**~~ ✅ Complete (UserEvent tracking with admin dashboard)

**Remaining Nice to Have:**
8. **OAuth (Apple, Facebook)** - Additional login options for user convenience
9. **Export wishlist as PDF** - Premium feature for sharing outside the app
10. **Set Secret Santa draw date** - Schedule draws in advance

---

## Feature Analysis: Image Upload ✅ IMPLEMENTED

### Current State (Post-Implementation)

WishBubble now supports both **external URLs and direct image uploads**:

- **Schema:** `imageUrl String?` (scraped) + `uploadedImage String?` (user uploads) on WishlistItem model
- **Storage:** Vercel Blob with CDN delivery
- **Upload API:** `POST /api/upload` with authentication, file type validation, and size limits
- **Display:** `uploadedImage || imageUrl` priority - user uploads take precedence
- **UI Component:** `ImageUpload` with drag-and-drop, file picker, preview, and removal
- **Translations:** Full EN/NL support for upload UI messages

### What Image Upload Should Do

**User Flow:**
1. User creates/edits a wishlist item
2. User can either:
   - Paste a product URL (existing behavior - auto-scrapes image)
   - Upload an image directly from their device
   - Keep both options available (uploaded image takes precedence)
3. System validates and processes the image
4. Image is stored permanently and served via CDN

**Functional Requirements:**
- [x] Upload images via file picker or drag-and-drop
- [x] Support common formats: JPEG, PNG, WebP, GIF
- [x] Maximum file size: 5MB (reasonable for product photos)
- [ ] Automatic image optimization (resize, compress, convert to WebP) - Not needed: Next.js `<Image>` component already handles on-the-fly optimization, format conversion, and responsive sizing. Server-side optimization would add complexity and cost without meaningful benefit.
- [ ] Generate thumbnails for list views - Not needed: Next.js `<Image>` with `sizes` prop generates appropriately sized images automatically. Storing separate thumbnails would duplicate storage costs.
- [x] Allow image removal/replacement
- [x] Fallback to URL if upload fails

**Technical Requirements:**
- [x] Server-side upload endpoint with authentication
- [x] File type validation (MIME type)
- [ ] Image dimension validation (min 100x100, max 4096x4096) - Low priority: MIME validation prevents non-images; very small images are rare user error; very large images are handled by 5MB size limit. Can add if abuse is detected.
- [ ] Virus/malware scanning - Enterprise feature: Requires external service (ClamAV, VirusTotal API) adding cost and latency. Not justified for a wishlist app with authenticated users only. Revisit if public uploads are ever allowed.
- [x] Unique filename generation (prevent overwrites)
- [x] CDN delivery with proper caching headers (Vercel Blob)
- [x] CORS configuration for direct browser uploads

### Recommended Approach: Vercel Blob

**Why Vercel Blob?**
1. **Zero configuration** - Works out of the box with Vercel deployment
2. **Edge delivery** - Built-in CDN, no extra setup
3. **Simple API** - `put()`, `del()`, `list()` operations
4. **Cost effective** - Pay per storage + bandwidth (generous free tier)
5. **Automatic optimization** - Can integrate with Next.js Image component
6. **Already on Vercel** - No additional vendor relationship

**Alternative options considered:**
| Service | Pros | Cons |
|---------|------|------|
| Vercel Blob | Native integration, simple | Vercel lock-in |
| Cloudinary | Advanced transforms, video | Separate vendor, complexity |
| AWS S3 | Industry standard, flexible | More setup, AWS account |
| Uploadthing | Good DX, type-safe | Another dependency |

### Implementation Plan

**Schema Changes:**
```prisma
model WishlistItem {
  // Existing
  imageUrl      String?   // Keep for backwards compatibility

  // New
  uploadedImage String?   // Vercel Blob URL for uploaded images
  imageThumbnail String?  // Generated thumbnail URL (optional)
}
```

**API Endpoints:**
```
POST /api/upload/image     - Upload image, returns blob URL
DELETE /api/upload/image   - Delete uploaded image
```

**UI Components:**
- ImageUpload component with drag-and-drop zone
- Preview thumbnail before save
- Loading state during upload
- Error handling with retry option

**Migration Strategy:**
1. Add new fields to schema (non-breaking)
2. Implement upload API and component
3. Update wishlist item form to show both options
4. Display `uploadedImage || imageUrl` in UI
5. No migration of existing data needed

### Estimated Effort

**Backend:** ~4 hours
- Vercel Blob setup and configuration
- Upload API endpoint with validation
- Delete endpoint for cleanup
- Integration with wishlist item CRUD

**Frontend:** ~4 hours
- ImageUpload component
- Integration in wishlist item form
- Preview and loading states
- Error handling

**Testing & Polish:** ~2 hours
- File type edge cases
- Large file handling
- Mobile upload experience

**Total: ~10 hours**

### Cost Implications

**Vercel Blob Pricing (as of 2025):**
- Storage: $0.15/GB/month
- Bandwidth: $0.10/GB

**Estimated usage (1000 MAU):**
- Average 10 items per user = 10,000 images
- Average image size: 200KB (after optimization)
- Total storage: ~2GB = $0.30/month
- Bandwidth (assume 50% viewed monthly): 1GB = $0.10/month
- **Monthly cost: ~$0.40** (negligible)

At scale (100k MAU): ~$40/month for images

### Security Considerations

- [x] Authenticated uploads only (require session)
- [x] File type validation (whitelist, not blacklist)
- [x] Max file size enforcement (client + server)
- [x] Sanitize filenames (unique generated names)
- [ ] Rate limit uploads (prevent abuse) - deferred
- [ ] Consider NSFW detection for public profiles (future)

---

## Feature Analysis: Push Notifications ✅ IMPLEMENTED

### Current State (Post-Implementation)

WishBubble now supports browser/mobile push notifications:

**Implemented Infrastructure:**
- **PWA Configuration:** next-pwa with custom worker for push handling
- **Web Push API:** Using `web-push` npm package with VAPID authentication
- **PushSubscription Model:** Stores device subscriptions with endpoint, p256dh, and auth keys
- **User Preference:** `notifyPush` toggle in User model and Settings page
- **API Endpoints:** `/api/push/vapid-key`, `/api/push/subscribe` (POST/DELETE)
- **Service Worker:** Custom `worker/index.ts` with push and notificationclick handlers
- **Client Hook:** `usePushNotifications` for subscription management
- **Integration:** All notification triggers now send push notifications automatically

**Completed:**
- [x] Service worker push subscription logic
- [x] VAPID key generation and storage
- [x] PushSubscription model in database
- [x] Push notification sending API
- [x] User preference toggle for push notifications
- [x] Push notification trigger integration

### What Push Notifications Should Do

**User Flow:**
1. User visits the app → Service worker registers automatically (already happens via next-pwa)
2. User enables push notifications in settings → Browser permission prompt appears
3. User grants permission → Subscription stored in database
4. Events occur (item claimed, draw completed, etc.) → Push sent to subscribed devices
5. User clicks notification → Opens app to relevant page

**Notification Triggers (matching existing in-app notifications):**
- Member joined group
- Secret Santa draw completed
- Event approaching (1 day, 7 days)
- Item claimed (notifies other members, not item owner)
- Wishlist shared to group
- New bubble invitation

**Functional Requirements:**
- [x] Subscribe/unsubscribe from push notifications per device
- [x] Support multiple devices per user
- [x] Respect existing notification preferences (only send if `notifyPush` is true)
- [x] Rich notifications with icon, title, body, and action URL
- [x] Notification click opens relevant page in app
- [x] Silent fallback if push fails (already have in-app + email)
- [x] Automatic cleanup of expired/invalid subscriptions

**Technical Requirements:**
- [x] Generate VAPID key pair (one-time setup, store in env)
- [x] Service worker with push event handler
- [x] API endpoint for subscription management (POST/DELETE /api/push/subscribe)
- [x] API endpoint to send push notifications (internal use via `sendPushNotification`)
- [x] PushSubscription model to store device subscriptions
- [x] Integration with existing `createNotification` function

### Recommended Approach: Web Push API + next-pwa

**Why Web Push API?**
1. **Native browser support** - Works on Chrome, Firefox, Edge, Safari (17.4+)
2. **PWA already configured** - next-pwa handles service worker generation
3. **No external service needed** - Use `web-push` npm package directly
4. **Free** - No per-notification costs (unlike Firebase Cloud Messaging relay)
5. **Privacy-preserving** - Subscriptions are per-device, no tracking

**Alternative options considered:**
| Service | Pros | Cons |
|---------|------|------|
| Web Push API | Free, native, private | Manual implementation |
| Firebase Cloud Messaging | Easy setup, reliable | Google dependency, adds complexity |
| OneSignal | Great dashboard, segmentation | Per-notification costs at scale, another vendor |
| Pusher Beams | Real-time focused | Overkill for notification-only use case |

### Implementation Plan

**Schema Changes:**
```prisma
model PushSubscription {
  id        String   @id @default(cuid())
  userId    String

  // Web Push subscription data
  endpoint  String   @db.Text
  p256dh    String   // Public key for encryption
  auth      String   // Auth secret

  // Device metadata
  deviceId  String?  // Fingerprint for deduplication
  userAgent String?  // Browser/device info

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, endpoint]) // One subscription per endpoint per user
  @@index([userId])
}
```

**User Model Addition:**
```prisma
model User {
  // ... existing fields
  notifyPush Boolean @default(false) // New preference

  // Relations
  pushSubscriptions PushSubscription[]
}
```

**Environment Variables:**
```
VAPID_PUBLIC_KEY=   # Base64 encoded public key
VAPID_PRIVATE_KEY=  # Base64 encoded private key
VAPID_SUBJECT=mailto:support@wish-bubble.app
```

**API Endpoints:**
```
GET  /api/push/vapid-key     - Get public VAPID key for client subscription
POST /api/push/subscribe     - Store push subscription for current user
DELETE /api/push/subscribe   - Remove subscription (unsubscribe)
POST /api/push/send          - Send push notification (internal/admin only)
```

**Service Worker (public/sw-push.js or injected by next-pwa):**
```javascript
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data: { url: data.url },
    vibrate: [100, 50, 100],
  };
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.notification.data?.url) {
    event.waitUntil(clients.openWindow(event.notification.data.url));
  }
});
```

**Client Hook (usePushNotifications):**
- Check browser support (`'PushManager' in window`)
- Check permission state (`Notification.permission`)
- Request permission and subscribe
- Send subscription to backend
- Handle unsubscribe

**Integration Points:**
1. Modify `createNotification` in `src/lib/notifications.ts` to also trigger push
2. Add push preference toggle in Settings page notification section
3. Add push subscription button/toggle in UI

### Migration Strategy

1. Add `PushSubscription` model and `notifyPush` to User (non-breaking)
2. Generate VAPID keys and add to environment
3. Implement subscription API endpoints
4. Add service worker push handler
5. Add `usePushNotifications` hook
6. Update Settings page with push toggle
7. Integrate push sending into existing notification triggers
8. Add "Enable notifications" prompt after key actions (joining bubble, etc.)

### Cost Implications

**Web Push API:** Free - no per-notification costs

**Operational considerations:**
- VAPID keys are permanent (don't rotate unless compromised)
- Subscriptions can become invalid (browser cleared, user uninstalled PWA)
- Failed sends should mark subscription as invalid and clean up

### Security Considerations

- [x] Authenticated subscription management (require session)
- [x] VAPID key security (store private key only in server env)
- [x] Validate subscription endpoint format (zod schema)
- [x] Encrypt notification payload (Web Push API handles this)
- [x] Never expose private VAPID key to client (only NEXT_PUBLIC_VAPID_PUBLIC_KEY is exposed)
- [x] Clean up orphaned subscriptions on 410/404 errors
- [ ] Rate limit subscription attempts - Low priority: authenticated endpoint, natural limit of one subscription per device. Can add if abuse is detected.

### Browser Support

| Browser | Desktop | Mobile |
|---------|---------|--------|
| Chrome | ✅ | ✅ |
| Firefox | ✅ | ✅ |
| Edge | ✅ | ✅ |
| Safari | ✅ (16.4+) | ✅ (16.4+, iOS) |
| Samsung Internet | N/A | ✅ |

**Note:** Safari on iOS requires the app to be added to home screen (PWA) for push notifications to work.

### Deferred Considerations

- [ ] Notification grouping/bundling (collapse similar notifications) - Adds complexity, revisit if notification volume becomes an issue
- [ ] Silent push for background sync - Not needed for wishlist app; all notifications are user-facing
- [ ] Push notification analytics (delivery rates, click rates) - Nice to have but not critical for MVP
- [ ] Per-notification-type preferences - Current model uses single `notifyPush` toggle; granular control can be added if users request it

---

## Feature Analysis: Bubble Chat/Comments

### Current State

Bubbles currently have no way for members to communicate within the app. All coordination happens outside WishBubble (WhatsApp, email, etc.).

**Existing Infrastructure:**
- **Activity Log:** Tracks events like member joins, claims, draws - but not user messages
- **Notifications:** In-app, email, and push notifications for system events
- **Member List:** All members visible with roles (Owner, Admin, Member)
- **Real-time Updates:** Not currently implemented (pages use server components with refresh)

**Use Cases for Chat:**
1. Coordinate gift ideas ("Should we do a group gift for Sarah?")
2. Ask clarifying questions ("What size does Tom wear?")
3. Announce logistics ("Gifts due by Dec 20th!")
4. General group banter and excitement building

### What Bubble Chat Should Do

**User Flow:**
1. User opens a bubble → Chat tab/section visible
2. User types a message → Sent immediately, visible to all members
3. Other members see message on next refresh or via real-time updates
4. Optional: @mentions to notify specific members
5. Messages persist indefinitely (or until bubble is archived)

**Functional Requirements:**
- [x] Send text messages to bubble
- [x] View message history (paginated, chronological order)
- [x] Show sender name, avatar, and timestamp
- [x] Support basic formatting (line breaks, emoji via keyboard)
- [ ] @mention members for direct notifications
- [x] Delete own messages
- [x] Admin/Owner can delete any message
- [ ] Unread message indicator on bubble card/tab
- [x] Notify members on new message (respecting notification preferences)

**Technical Requirements:**
- [x] BubbleMessage model in database
- [x] API endpoints for CRUD operations
- [ ] Real-time updates (polling or WebSockets)
- [x] Pagination for message history (cursor-based)
- [x] Integration with notification system
- [x] Message validation (max 2000 chars)

### Recommended Approach: Simple Polling

**Why Polling over WebSockets?**
1. **Simpler infrastructure** - No WebSocket server needed on Vercel
2. **Works with serverless** - Vercel functions are stateless
3. **Good enough for chat volume** - Gift groups have low message frequency
4. **Progressive enhancement** - Can add WebSockets later if needed

**Alternative options considered:**
| Approach | Pros | Cons |
|----------|------|------|
| Polling (5-10s) | Simple, serverless-friendly | Slight delay, more requests |
| Server-Sent Events | One-way real-time | Not great for serverless |
| WebSockets (Pusher/Ably) | True real-time | External service, complexity |
| Supabase Realtime | Built-in with Postgres | Would need to migrate DB |

### Implementation Plan

**Schema Changes:**
```prisma
model BubbleMessage {
  id       String  @id @default(cuid())
  bubbleId String
  userId   String

  content   String  @db.Text

  // Optional: for @mentions
  mentions  String[] // Array of user IDs mentioned

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime? // Soft delete

  bubble Bubble @relation(fields: [bubbleId], references: [id], onDelete: Cascade)
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([bubbleId, createdAt])
  @@index([userId])
}
```

**Bubble Model Addition:**
```prisma
model Bubble {
  // ... existing fields
  messages BubbleMessage[]
}
```

**API Endpoints:**
```
GET    /api/bubbles/[id]/messages       - Get paginated messages
POST   /api/bubbles/[id]/messages       - Send a message
DELETE /api/bubbles/[id]/messages/[mid] - Delete a message (soft delete)
```

**UI Components:**
- `BubbleChat` - Main chat container with message list and input
- `ChatMessage` - Individual message with avatar, name, time, actions
- `ChatInput` - Text input with send button and optional mention picker
- Chat tab in bubble detail page (alongside Members, Wishlists tabs)

**Notification Integration:**
- New `BUBBLE_MESSAGE` notification type
- Notify members when mentioned (@name)
- Optional: notify on any new message (configurable per member)
- Push notifications for mentioned users

### Migration Strategy

1. Add `BubbleMessage` model to schema (non-breaking)
2. Add messages relation to Bubble model
3. Create API endpoints with validation
4. Build chat UI components
5. Add Chat tab to bubble detail page
6. Integrate with notification system
7. Add translations (EN/NL)
8. Optional: Add polling for near-real-time updates

### Cost Implications

**Database:** Minimal - text messages are small
- Estimated: 100 messages/bubble × 1000 bubbles = 100K rows
- Storage: ~10MB for message content

**API Requests:** Moderate if polling
- 5-second polling × 10 active users = 120 req/min per bubble
- Vercel free tier: 100K requests/month
- Should be fine for current scale; add exponential backoff for idle tabs

### Security Considerations

- [x] Only bubble members can send/view messages
- [ ] Rate limit message sending (e.g., 10 messages/minute)
- [x] Validate message content (max 2000 chars)
- [x] Soft delete to preserve audit trail
- [x] Admin/Owner moderation capabilities (delete any message)
- [x] Prevent XSS via proper escaping (React handles this)

### Deferred Considerations

- [ ] File/image attachments - Adds complexity and storage costs; text-only for MVP
- [ ] Message reactions (emoji) - Nice to have, not essential for coordination
- [ ] Threaded replies - Overkill for small group chat
- [ ] Read receipts - Privacy concerns, not needed for gift coordination
- [ ] Message search - Can add if chat history grows large
- [ ] WebSocket real-time - Upgrade path if polling isn't sufficient

---

---

## Feature Analysis: Security Headers

### Current State

WishBubble currently has no custom security headers configured. The application relies on Next.js and Vercel defaults.

**External Resources Used:**
- **Google Fonts** - Fraunces and Source Sans 3 fonts
- **Google AdSense** - `pagead2.googlesyndication.com` (if ADSENSE_CLIENT_ID set)
- **Stripe** - Payment processing (JS loaded dynamically)
- **Sentry** - Error monitoring and session replay
- **Vercel Analytics** - `va.vercel-scripts.com`
- **Google reCAPTCHA** - Contact form protection

### Implemented Security Headers ✅

| Header | Purpose | Value |
|--------|---------|-------|
| `X-DNS-Prefetch-Control` | Control DNS prefetching | `on` |
| `Strict-Transport-Security` | Force HTTPS | `max-age=63072000; includeSubDomains; preload` |
| `X-Content-Type-Options` | Prevent MIME sniffing | `nosniff` |
| `X-Frame-Options` | Prevent clickjacking | `SAMEORIGIN` |
| `X-XSS-Protection` | Legacy XSS filter | `1; mode=block` |
| `Referrer-Policy` | Control referrer info | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | Restrict browser features | See implementation |
| `Content-Security-Policy` | Control resource loading | See implementation |

### Content-Security-Policy Breakdown

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval'
  https://*.sentry.io
  https://*.stripe.com
  https://js.stripe.com
  https://va.vercel-scripts.com
  https://www.google.com
  https://www.gstatic.com
  https://pagead2.googlesyndication.com
  https://www.googletagservices.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
img-src 'self' data: blob: https: http:;
font-src 'self' https://fonts.gstatic.com;
connect-src 'self'
  https://*.sentry.io
  https://*.stripe.com
  https://va.vercel-scripts.com
  https://www.google.com;
frame-src 'self'
  https://*.stripe.com
  https://js.stripe.com
  https://www.google.com
  https://googleads.g.doubleclick.net;
worker-src 'self' blob:;
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'self';
upgrade-insecure-requests;
```

### Permissions-Policy

```
camera=(),
microphone=(),
geolocation=(),
interest-cohort=(),
payment=(self "https://js.stripe.com"),
usb=(),
magnetometer=(),
gyroscope=(),
accelerometer=()
```

### Implementation Approach

Use Next.js `headers()` function in `next.config.ts` to apply headers to all routes.

**Why not middleware?**
- Headers function is simpler for static header values
- Middleware adds latency to every request
- Security headers don't need request-time logic

### Testing

After implementation:
1. Check headers with browser DevTools (Network tab → Response Headers)
2. Use https://securityheaders.com to verify configuration
3. Use https://csp-evaluator.withgoogle.com for CSP analysis
4. Test all functionality (Stripe payments, Sentry errors, Google fonts)

### Deferred Considerations

- [ ] CSP reporting endpoint (`report-uri` or `report-to`) - Adds complexity, can add if needed
- [ ] Nonce-based CSP for inline scripts - Requires significant refactoring
- [ ] Subresource Integrity (SRI) for external scripts - Next.js handles most cases

---

## Feature Analysis: Beta Testing Program

### Purpose

A beta testing program would allow WishBubble to:
1. **Get early feedback** on new features before general release
2. **Build community** with engaged power users who feel invested
3. **Reduce risk** of shipping bugs to all users
4. **Validate features** with real-world usage patterns
5. **Create advocates** who can provide testimonials and word-of-mouth

### Current State

WishBubble has existing infrastructure that can support a beta program:
- **Subscription tiers** (FREE, PREMIUM, FAMILY) for targeting
- **Announcements system** with tier-based targeting
- **Coupon system** for offering rewards/perks
- **Feedback system** for collecting bug reports and suggestions
- **User locale** for language-specific communications

**✅ Implemented (Tier 1):**
- `isBetaTester` flag on User model with `betaOptInAt` timestamp
- Feature flag utility (`lib/features.ts`) for gradual rollouts
- Beta program toggle in Settings page
- API endpoint for toggling beta status

**Deferred:**
- Dedicated beta feedback channel (can use existing feedback system)
- Beta-specific announcements targeting

### What a Beta Program Could Include

**Tier 1: Opt-in Beta Features**
- Users can enable "beta features" in settings
- See new features 1-2 weeks before general release
- Provide feedback through dedicated beta feedback form
- Non-breaking changes only (UI tweaks, new optional features)

**Tier 2: Structured Beta Program**
- Application/invite-only beta testers
- Access to preview/staging environment
- Monthly beta tester calls or surveys
- Early access to major features
- Recognition (badge, beta tester role)

**Tier 3: Full Beta Community**
- Private Discord/Slack channel for beta testers
- Direct line to product team
- Influence on roadmap priorities
- Free Premium subscription as thank-you
- Name in credits/contributors page

### Recommended Approach: Tier 1 (Simple Opt-in)

Start with the simplest approach that provides value without major infrastructure changes.

**Schema Changes:**
```prisma
model User {
  // ... existing fields
  isBetaTester    Boolean   @default(false)
  betaOptInAt     DateTime?
  betaFeedbackCount Int     @default(0) // Track engagement
}
```

**Implementation Steps:**

1. **Add beta flag to User model**
   - `isBetaTester: Boolean @default(false)`
   - `betaOptInAt: DateTime?`

2. **Add beta toggle in Settings page**
   - Switch to opt-in/out of beta program
   - Brief explanation of what beta includes
   - Link to feedback form

3. **Create feature flag utility**
   ```typescript
   // lib/features.ts
   export const BETA_FEATURES = {
     newChatReactions: true,
     aiWishlistSuggestions: true,
     darkModeV2: false,
   } as const;

   export function isFeatureEnabled(
     feature: keyof typeof BETA_FEATURES,
     user?: { isBetaTester?: boolean }
   ): boolean {
     const isEnabled = BETA_FEATURES[feature];
     if (isEnabled === true) return true;  // GA for everyone
     if (isEnabled === false) return false; // Disabled
     return user?.isBetaTester ?? false;   // Beta only
   }
   ```

4. **Add beta indicator in UI**
   - Small "BETA" badge on beta-only features
   - Tooltip explaining feature is in testing

5. **Create beta feedback form**
   - Dedicated form for beta feature feedback
   - Link feature name to feedback
   - Track which features get most feedback

6. **Target announcements to beta testers**
   - Already have `targetTiers` on Announcement
   - Could add `targetBetaOnly: Boolean` field
   - Or use a special "BETA" tier

### UI/UX Considerations

**Settings Page Addition:**
```
┌─────────────────────────────────────────┐
│ Beta Program                            │
│ ─────────────────────────────────────── │
│ [Toggle] Enable beta features           │
│                                         │
│ Get early access to new features before │
│ they're released to everyone. Help us   │
│ improve WishBubble by testing and       │
│ providing feedback.                     │
│                                         │
│ ⚠️ Beta features may have bugs or       │
│ change before final release.            │
└─────────────────────────────────────────┘
```

**Beta Badge Component:**
```tsx
<Badge variant="outline" className="text-xs bg-purple-100">
  BETA
</Badge>
```

### Benefits of This Approach

| Benefit | Description |
|---------|-------------|
| Low complexity | Single boolean flag, no separate environment |
| Self-service | Users opt-in themselves, no manual management |
| Reversible | Users can opt-out anytime |
| Trackable | Can measure beta adoption and engagement |
| Gradual | Can add more sophisticated features later |

### Metrics to Track

- **Beta opt-in rate**: % of users who enable beta
- **Beta retention**: % who stay opted in after 30 days
- **Feedback volume**: Bug reports/suggestions from beta users
- **Feature adoption**: Usage of beta features vs stable
- **Bug discovery**: Bugs found by beta users before GA

### Incentives (Optional)

To encourage participation without major cost:

1. **Recognition**
   - "Beta Tester" badge on profile
   - Name in release notes when features ship

2. **Influence**
   - Early voting on feature roadmap
   - Priority support responses

3. **Perks** (for active testers)
   - 1 month free Premium for submitting 10+ feedback items
   - Use existing coupon system for rewards

### Migration Strategy

1. Add `isBetaTester` field to User model (non-breaking)
2. Add beta toggle to Settings page
3. Create feature flag utility
4. Wrap first beta feature with flag
5. Send announcement inviting users to join beta
6. Monitor adoption and iterate

### Cost Implications

**Minimal:**
- Database: One boolean field per user (~negligible)
- Development: ~2-4 hours initial setup
- Maintenance: Feature flag management per release

**No additional infrastructure needed** - uses existing:
- Database (Prisma/PostgreSQL)
- Settings page
- Feedback system
- Announcement system

### Security Considerations

- [ ] Beta features should still be fully tested (just less polish)
- [ ] Don't expose admin/dangerous features to beta
- [ ] Rate limit beta feedback submissions
- [ ] Don't store sensitive data in beta-only tables

### Deferred Considerations

- [ ] Separate staging environment for beta - Adds deployment complexity
- [ ] Private beta community (Discord/Slack) - Requires community management
- [ ] Beta tester application process - Overkill for current scale
- [ ] A/B testing framework - More complex than simple feature flags
- [ ] Percentage-based rollouts - Can add later if needed

### Example: Rolling Out Chat Reactions as Beta Feature

```typescript
// In BubbleChat component
import { isFeatureEnabled } from "@/lib/features";

function ChatMessage({ message, user }: Props) {
  const showReactions = isFeatureEnabled("chatReactions", user);

  return (
    <div className="message">
      <p>{message.content}</p>
      {showReactions && (
        <div className="flex gap-1">
          <ReactionPicker messageId={message.id} />
          <Badge variant="outline" className="text-xs">BETA</Badge>
        </div>
      )}
    </div>
  );
}
```

---

## Feature Analysis: Usage Metrics & User Journey Tracking

### Purpose

Usage metrics and user journey tracking enable:
1. **Product optimization** - Understand which features drive value
2. **Conversion optimization** - Identify and fix drop-off points
3. **Retention analysis** - Understand what keeps users engaged
4. **Feature prioritization** - Data-driven roadmap decisions
5. **Personalization** - Tailor experience based on behavior patterns

### Current State

**✅ Existing Infrastructure:**
- **Activity table** - 44+ event types logged to database (auth, groups, wishlists, claims, subscriptions)
- **Sentry** - Error tracking with session replay
- **Vercel Analytics** - Web Vitals only
- **Admin dashboards** - Growth metrics (`/admin`) and financial metrics (`/admin/financials`)
- **Device fingerprinting** - BubbleAccessLog for security tracking
- **User lastLoginAt** - Login tracking

**✅ Implemented:**
- UserEvent and UserJourney database models
- Client-side analytics utilities (`lib/analytics-client.ts`)
- API endpoints for event and journey tracking (`/api/analytics/event`, `/api/analytics/journey`)
- React hooks (`useAnalytics`, `useFeatureTracking`, `useJourneyTracking`)
- AnalyticsProvider for automatic page view tracking
- Predefined user journeys (`lib/journeys.ts`)

**Deferred:**
- Admin analytics dashboard (can use existing DB queries)
- Search query analytics
- Feature adoption charts

### Recommended Approach: Event-Based Tracking

Rather than adding a third-party analytics tool (Mixpanel, Amplitude), we'll extend the existing Activity logging system with a lightweight client-side event system that:
1. Uses the existing Activity table for server-side events
2. Adds a new `UserEvent` table for client-side interactions
3. Creates reusable tracking hooks for React components
4. Provides admin dashboards for insights

### Schema Design

```prisma
// Lightweight event tracking for client-side interactions
model UserEvent {
  id        String   @id @default(cuid())
  userId    String?  // Optional - for anonymous tracking
  sessionId String   // Client-generated session ID

  // Event details
  category  String   // e.g., "navigation", "feature", "conversion", "engagement"
  action    String   // e.g., "click", "view", "complete", "abandon"
  label     String?  // Optional context e.g., "pricing_premium_button"
  value     Int?     // Optional numeric value

  // Context
  page      String   // URL path
  referrer  String?  // Previous page

  // Device info (lightweight)
  deviceType String? // "desktop", "mobile", "tablet"

  // Timestamps
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([sessionId])
  @@index([category, action])
  @@index([createdAt])
  @@index([page])
}

// Journey tracking - predefined user flows
model UserJourney {
  id        String   @id @default(cuid())
  userId    String?
  sessionId String

  // Journey definition
  journeyType String  // e.g., "registration_to_first_claim", "visitor_to_premium"

  // Progress tracking
  steps     Json     // Array of step completions with timestamps
  currentStep Int    @default(0)

  // Outcome
  status    JourneyStatus @default(IN_PROGRESS)
  completedAt DateTime?
  abandonedAt DateTime?

  // Timing
  startedAt DateTime @default(now())

  @@index([userId])
  @@index([journeyType, status])
  @@index([startedAt])
}

enum JourneyStatus {
  IN_PROGRESS
  COMPLETED
  ABANDONED
}
```

### Predefined User Journeys

```typescript
// lib/journeys.ts
export const USER_JOURNEYS = {
  // Core conversion funnels
  VISITOR_TO_USER: {
    id: "visitor_to_user",
    name: "Visitor to User",
    steps: ["landing_page", "pricing_view", "register_start", "register_complete", "email_verified"],
  },

  ONBOARDING: {
    id: "onboarding",
    name: "New User Onboarding",
    steps: ["register_complete", "first_bubble_created", "first_wishlist_created", "first_item_added", "first_member_invited"],
  },

  FIRST_CLAIM: {
    id: "first_claim",
    name: "First Gift Claim",
    steps: ["bubble_joined", "wishlist_viewed", "item_viewed", "item_claimed"],
  },

  SECRET_SANTA: {
    id: "secret_santa",
    name: "Secret Santa Flow",
    steps: ["bubble_created", "members_invited", "draw_initiated", "draw_completed", "assignment_viewed"],
  },

  FREE_TO_PREMIUM: {
    id: "free_to_premium",
    name: "Upgrade Journey",
    steps: ["limit_reached", "pricing_viewed", "plan_selected", "checkout_started", "payment_completed"],
  },

  GIFT_COMPLETION: {
    id: "gift_completion",
    name: "Gift Giving Flow",
    steps: ["item_claimed", "item_purchased", "event_completed"],
  },
} as const;
```

### Event Categories

```typescript
// lib/analytics.ts
export const EVENT_CATEGORIES = {
  // Navigation events
  NAVIGATION: "navigation",

  // Feature interaction
  FEATURE: "feature",

  // Conversion events
  CONVERSION: "conversion",

  // Engagement events
  ENGAGEMENT: "engagement",

  // Error events
  ERROR: "error",
} as const;

export const EVENT_ACTIONS = {
  // Views
  VIEW: "view",
  PAGEVIEW: "pageview",

  // Interactions
  CLICK: "click",
  SUBMIT: "submit",
  TOGGLE: "toggle",

  // Progress
  START: "start",
  COMPLETE: "complete",
  ABANDON: "abandon",

  // Specific actions
  SEARCH: "search",
  SHARE: "share",
  COPY: "copy",
  DOWNLOAD: "download",
} as const;
```

### Client-Side Implementation

```typescript
// lib/analytics-client.ts
"use client";

import { v4 as uuidv4 } from "uuid";

// Session management
const getSessionId = (): string => {
  if (typeof window === "undefined") return "";

  let sessionId = sessionStorage.getItem("wb_session_id");
  if (!sessionId) {
    sessionId = uuidv4();
    sessionStorage.setItem("wb_session_id", sessionId);
  }
  return sessionId;
};

const getDeviceType = (): string => {
  if (typeof window === "undefined") return "unknown";
  const width = window.innerWidth;
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
};

interface TrackEventParams {
  category: string;
  action: string;
  label?: string;
  value?: number;
}

// Fire-and-forget event tracking
export const trackEvent = async (params: TrackEventParams): Promise<void> => {
  try {
    // Use sendBeacon for non-blocking
    const data = {
      ...params,
      sessionId: getSessionId(),
      page: window.location.pathname,
      referrer: document.referrer,
      deviceType: getDeviceType(),
    };

    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/analytics/event", JSON.stringify(data));
    } else {
      fetch("/api/analytics/event", {
        method: "POST",
        body: JSON.stringify(data),
        keepalive: true,
      });
    }
  } catch {
    // Silent fail - analytics should never break the app
  }
};

// Journey tracking
export const trackJourneyStep = async (
  journeyType: string,
  step: string
): Promise<void> => {
  try {
    fetch("/api/analytics/journey", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        journeyType,
        step,
        sessionId: getSessionId(),
      }),
    });
  } catch {
    // Silent fail
  }
};
```

### React Hook for Tracking

```typescript
// hooks/use-analytics.ts
"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackEvent, trackJourneyStep } from "@/lib/analytics-client";

export function useAnalytics() {
  const pathname = usePathname();
  const prevPathname = useRef(pathname);

  // Auto-track page views
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      trackEvent({
        category: "navigation",
        action: "pageview",
        label: pathname,
      });
      prevPathname.current = pathname;
    }
  }, [pathname]);

  const track = useCallback((
    category: string,
    action: string,
    label?: string,
    value?: number
  ) => {
    trackEvent({ category, action, label, value });
  }, []);

  const trackJourney = useCallback((
    journeyType: string,
    step: string
  ) => {
    trackJourneyStep(journeyType, step);
  }, []);

  return { track, trackJourney };
}

// Component wrapper for tracking feature usage
export function useFeatureTracking(featureName: string) {
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      trackEvent({
        category: "feature",
        action: "view",
        label: featureName,
      });
      mounted.current = true;
    }
  }, [featureName]);

  const trackInteraction = useCallback((action: string, label?: string) => {
    trackEvent({
      category: "feature",
      action,
      label: `${featureName}:${label || action}`,
    });
  }, [featureName]);

  return { trackInteraction };
}
```

### Key Tracking Points

| Location | Event | Purpose |
|----------|-------|---------|
| Landing page | `navigation:pageview` | Traffic source |
| Pricing page | `conversion:view:pricing` | Interest in premium |
| Register form | `conversion:start:registration` | Signup intent |
| Register success | `conversion:complete:registration` | Signup rate |
| Create bubble | `feature:complete:bubble_create` | Feature adoption |
| Add wishlist item | `feature:complete:item_add` | Engagement depth |
| Claim item | `feature:complete:claim` | Core action |
| Secret Santa draw | `feature:complete:secret_santa` | Feature usage |
| Upgrade button | `conversion:click:upgrade` | Upgrade intent |
| Payment complete | `conversion:complete:payment` | Revenue |
| Share link copy | `engagement:copy:share_link` | Virality |
| Search query | `engagement:search` | Discovery patterns |

### API Endpoints

```typescript
// POST /api/analytics/event
// Batch events for efficiency
{
  events: [
    { category, action, label, value, sessionId, page, deviceType }
  ]
}

// POST /api/analytics/journey
// Update journey progress
{
  journeyType: string,
  step: string,
  sessionId: string
}

// GET /api/admin/analytics/events (admin only)
// Query events with filters
?category=conversion&action=complete&from=2024-01-01&to=2024-01-31

// GET /api/admin/analytics/journeys (admin only)
// Journey completion rates
?journeyType=onboarding&status=completed

// GET /api/admin/analytics/funnel (admin only)
// Funnel visualization data
?journeyType=free_to_premium
```

### Admin Dashboard Features

1. **Real-time Event Stream**
   - Live feed of recent events
   - Filter by category/action

2. **Feature Usage Dashboard**
   - Most used features
   - Feature adoption over time
   - Beta feature tracking

3. **Journey Funnels**
   - Visual funnel diagrams
   - Drop-off rates per step
   - Time between steps

4. **Conversion Metrics**
   - Visitor → User rate
   - Free → Premium rate
   - Registration completion rate

5. **Engagement Metrics**
   - Daily/Weekly/Monthly active users
   - Session duration (derived from events)
   - Feature stickiness

### Privacy Considerations

- **No PII in events** - Only IDs and category labels
- **Session-based for anonymous users** - Can track without login
- **Respect cookie consent** - Only track if analytics consent given
- **Data retention** - Aggregate after 90 days, delete after 1 year
- **GDPR compliance** - Include in data export, delete on account deletion

### Implementation Priority

**Phase 1: Core Infrastructure**
1. Add UserEvent and UserJourney models
2. Create analytics API endpoints
3. Build tracking hook and utilities
4. Add pageview tracking

**Phase 2: Key Events**
1. Registration funnel tracking
2. Feature usage tracking (bubble, wishlist, claims)
3. Conversion tracking (upgrade flow)

**Phase 3: Admin Dashboard**
1. Event explorer
2. Funnel visualization
3. Feature adoption charts

**Phase 4: Advanced**
1. Journey completion notifications
2. Cohort analysis
3. A/B test integration with feature flags

### Cost Implications

**Minimal:**
- Database storage: ~100 bytes per event, ~500 bytes per journey
- At 10,000 users with 50 events/day = 500K events/month = ~50MB/month
- Query optimization with indexes keeps reads fast

**No third-party costs** - Self-hosted using existing infrastructure

### Metrics to Track

| Metric | Calculation | Insight |
|--------|-------------|---------|
| **DAU/MAU** | Unique users with events per day/month | Engagement level |
| **Feature Adoption** | Users who used feature / Total users | Feature value |
| **Funnel Conversion** | Users completing step N / Users at step N-1 | Drop-off points |
| **Time to First Value** | Avg time from register to first claim | Onboarding friction |
| **Session Depth** | Avg events per session | Engagement quality |
| **Upgrade Rate** | Upgrades / Limit-hit events | Monetization |

---

*Document Version: 3.7*

*Last Updated: January 3, 2026*

**Changelog v3.7:**
- Added admin analytics dashboard (`/admin/analytics`) with visualizations
- Marked all recently completed features in project spec
- Updated remaining items list

**Changelog v3.6:**
- Implemented usage metrics & user journey tracking system
  - Added UserEvent and UserJourney models to Prisma schema
  - Created `/api/analytics/event` and `/api/analytics/journey` endpoints
  - Built client-side tracking utilities (`lib/analytics-client.ts`)
  - Created React hooks (`useAnalytics`, `useFeatureTracking`, `useJourneyTracking`)
  - Added AnalyticsProvider for automatic page view tracking
  - Defined 6 user journeys (onboarding, conversion, etc.)

**Changelog v3.5:**
- Implemented beta testing program (Tier 1: Simple Opt-in)
  - Added `isBetaTester` and `betaOptInAt` fields to User model
  - Created feature flag utility (`lib/features.ts`)
  - Added beta toggle in Settings page
  - Created beta API endpoint (`/api/user/beta`)
  - Added EN/NL translations

**Changelog v3.4:**
- Added comprehensive beta testing program analysis

**Changelog v3.3:**
- Implemented security headers (CSP, HSTS, X-Frame-Options, etc.)
- Added security headers analysis to project spec

**Changelog v3.2:**
- Implemented bubble chat feature (text messaging within groups)
- Added BubbleMessage model with soft delete support
- Created chat API endpoints (GET, POST, DELETE)
- Built BubbleChat UI component with message list and input
- Added Chat tab to bubble detail page
- Integrated chat with notification system (BUBBLE_MESSAGE type)
- Added EN/NL translations for chat feature
