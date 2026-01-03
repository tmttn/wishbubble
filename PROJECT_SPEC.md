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
    - [ ] Image upload
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



### Analytics & Tracking

- [x] Page views, sessions (Vercel Analytics)
- [x] Error tracking (Sentry with source maps, session replay)
- [x] Performance monitoring (Sentry Web Vitals + Vercel Analytics)
- [x] Cookie consent (GDPR-compliant, analytics disabled until opt-in)
- [ ] User journey tracking (funnels, user flows)
- [ ] Feature usage metrics (which features are used most)
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



### Phase 3: Polish & Launch (IN PROGRESS)

- [x] Admin dashboard (complete with analytics, YoY comparison)
- [ ] Analytics integration
- [x] Google AdSense integration (with ad-free for Premium users)
- [x] Performance optimization (N+1 query fixes, database indexes)
- [x] SEO optimization (meta tags, sitemap, JSON-LD structured data)
- [ ] Beta testing
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
- [ ] Custom security headers (Content-Security-Policy, etc.)
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
13. **Analytics integration** - Track user behavior
14. ~~**Premium tier + Stripe** - Monetization~~ ✅ Complete
15. **Push notifications** - PWA already configured

### Quick Wins
- ~~Contact form with admin management~~ ✅ Complete
- ~~Rate limiting on auth routes~~ ✅ Complete
- ~~Upgrade prompts when hitting plan limits~~ ✅ Complete
- ~~Premium avatar badge~~ ✅ Complete
- ~~"Someone joined" email notification~~ ✅ Complete
- ~~Redraw capability for Secret Santa~~ ✅ Complete
- ~~Member limit enforcement~~ ✅ Complete
- Add image upload (currently URL-only)

### Suggested Next Priorities

**High Impact / User-Facing:**
1. **Image upload for wishlist items** - Currently URL-only, direct upload would significantly improve UX
2. **Push notifications** - PWA infrastructure ready, just needs service worker subscription logic
3. **Bubble chat/comments** - Allow members to discuss within groups, increases engagement

**Security & Polish:**
4. **Security headers** - Add CSP, X-Frame-Options, etc. via next.config.ts headers()
5. **Beta testing program** - Structured feedback collection before wider launch

**Analytics & Growth:**
6. **User journey tracking** - Funnels and flow analysis (PostHog or similar)
7. **Feature usage metrics** - Understand which features drive retention

**Nice to Have:**
8. **OAuth (Apple, Facebook)** - Additional login options for user convenience
9. **Export wishlist as PDF** - Premium feature for sharing outside the app
10. **Set Secret Santa draw date** - Schedule draws in advance

---

## Feature Analysis: Image Upload

### Current State

Currently, WishBubble handles images via **external URLs only**:

- **Schema:** `imageUrl String?` on WishlistItem model
- **Input:** Hidden field populated by URL scraping (Bol.com API, Open Graph)
- **Validation:** `z.string().url().optional().or(z.literal(""))`
- **Display:** Next.js `<Image>` component with `remotePatterns` whitelist
- **No upload infrastructure:** No file storage service (Vercel Blob, S3, Cloudinary, etc.)

**Limitations of URL-only approach:**
1. Users cannot add images for items without product URLs
2. External images may disappear or change (link rot)
3. No control over image quality, size, or format
4. Scraped images may be low resolution or wrong aspect ratio
5. Some retailers block hotlinking

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
- [ ] Upload images via file picker or drag-and-drop
- [ ] Support common formats: JPEG, PNG, WebP, GIF
- [ ] Maximum file size: 5MB (reasonable for product photos)
- [ ] Automatic image optimization (resize, compress, convert to WebP)
- [ ] Generate thumbnails for list views
- [ ] Allow image removal/replacement
- [ ] Fallback to URL if upload fails

**Technical Requirements:**
- [ ] Server-side upload endpoint with authentication
- [ ] File type validation (MIME type + magic bytes)
- [ ] Image dimension validation (min 100x100, max 4096x4096)
- [ ] Virus/malware scanning (optional, for enterprise)
- [ ] Unique filename generation (prevent overwrites)
- [ ] CDN delivery with proper caching headers
- [ ] CORS configuration for direct browser uploads

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

- [ ] Authenticated uploads only (require session)
- [ ] File type validation (whitelist, not blacklist)
- [ ] Max file size enforcement (client + server)
- [ ] Sanitize filenames (prevent path traversal)
- [ ] Rate limit uploads (prevent abuse)
- [ ] Consider NSFW detection for public profiles (future)

---

*Document Version: 2.7*

*Last Updated: January 3, 2026*
