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
    - [ ] Allow external wishlists
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
- [ ] Redraw capability (admin)



### Notifications

- [x] Email notifications:
    - [x] Group invitation
    - [ ] Someone joined your group
    - [ ] Reminder to add wishlist
    - [ ] Event approaching reminder
    - [x] Secret Santa draw completed
    - [ ] Weekly digest of group activity
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
- [ ] Push notifications (PWA configured but not implemented)
- [ ] Notification preferences per group
- [x] User notification preferences (notifyEmail, notifyInApp, notifyDigest)
- [x] Notifications respect user settings (notifyInApp toggle)
- [x] Digest day selection (day of week)
- [x] Notification model with types (schema ready)



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
- [ ] User suspension/deletion
- [ ] Email campaign management
- [ ] Announcement system

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

- [ ] Page views, sessions

- [ ] User journey tracking

- [ ] Feature usage metrics

- [ ] A/B testing framework

- [ ] Error tracking

- [ ] Performance monitoring



---



## Tech Stack Recommendation



### Frontend

```

Framework:      Next.js 14+ (App Router)

Language:       TypeScript

Styling:        Tailwind CSS + shadcn/ui

State:          Zustand or React Query

Forms:          React Hook Form + Zod

```



**Why Next.js?**

- SSR/SSG for SEO (important for organic growth)

- API routes for simple backends

- Excellent developer experience

- Vercel deployment is seamless

- Built-in image optimization



### Backend

```

Runtime:        Node.js (via Next.js API routes)

                OR separate NestJS service for scale

Database:       PostgreSQL (via Supabase or Neon)

ORM:            Prisma

Auth:           NextAuth.js (Auth.js)

Email:          Resend or SendGrid

File Storage:   Cloudflare R2 or AWS S3

```



**Why PostgreSQL?**

- Relational data (users, bubbles, items, claims)

- ACID compliance for claim transactions

- Excellent tooling (Prisma, Supabase)



### Infrastructure

```

Hosting:        Vercel (frontend + API)

                OR Railway/Render for full-stack

Database:       Supabase (free tier generous)

                OR Neon (serverless PostgreSQL)

CDN:            Cloudflare (free tier)

Monitoring:     Sentry (error tracking)

Analytics:      Plausible or PostHog

Ads:            Google AdSense

```



### Alternative: Full Supabase Stack

```

Frontend:       Next.js

Backend:        Supabase (Auth, Database, Storage, Edge Functions)

Realtime:       Supabase Realtime (for live claim updates)

```



**Pros:** Faster development, less infrastructure management

**Cons:** Vendor lock-in, less flexibility



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



### Tier 1: Free (Core)

- Create unlimited bubbles (up to 10 members each)

- Create wishlist with up to 25 items

- Basic email notifications

- **Ad-supported** (banner ads, non-intrusive)



### Tier 2: Premium ($2.99/month or $24.99/year)

- Unlimited bubble members

- Unlimited wishlist items

- **Ad-free experience**

- Priority email support

- Custom bubble themes

- Advanced exclusion rules for Secret Santa

- Export wishlist as PDF



### Tier 3: Family/Group ($7.99/month)

- Everything in Premium

- Up to 6 accounts

- Shared across family members

- Priority feature requests



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

| Premium Revenue | $3,600 | $27,000 | $144,000 |

| Ad Revenue | $1,200 | $6,000 | $24,000 |

| Affiliate Revenue | $2,400 | $18,000 | $96,000 |

| **Total Annual** | **$7,200** | **$51,000** | **$264,000** |



---



## Hosting & Cost Breakdown



### Development Phase (0-6 months)

| Service | Cost/month |

|---------|-----------|

| Vercel (Hobby) | $0 |

| Supabase (Free) | $0 |

| Domain | $12/year |

| Resend (Free tier) | $0 |

| **Total** | ~$1/month |



### Launch Phase (6-12 months, <10k users)

| Service | Cost/month |

|---------|-----------|

| Vercel (Pro) | $20 |

| Supabase (Pro) | $25 |

| Resend | $20 |

| Cloudflare | $0 |

| Sentry | $0 (free tier) |

| **Total** | ~$65/month |



### Growth Phase (10k-100k users)

| Service | Cost/month |

|---------|-----------|

| Vercel (Pro) | $20 + usage |

| Supabase (Pro) | $25-100 |

| Resend/SendGrid | $50-100 |

| Cloudflare Pro | $20 |

| Sentry | $26 |

| Monitoring | $50 |

| **Total** | ~$200-350/month |



### Alternative: Self-Hosted (Cost-Optimized)

| Service | Cost/month |

|---------|-----------|

| Hetzner VPS (CX31) | €15 |

| Managed PostgreSQL | €20 |

| Cloudflare | $0 |

| Backups | €5 |

| **Total** | ~€40/month |



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
- [ ] Google AdSense integration
- [ ] Performance optimization
- [ ] SEO optimization
- [ ] Beta testing
- [x] Email verification flow
- [x] Password reset flow



### Phase 4: Growth Features (Planned)

- [ ] Premium tier implementation (schema ready)
- [ ] Stripe payment integration
- [ ] Affiliate link integration
- [ ] Mobile app (React Native or PWA)
- [ ] API for integrations
- [ ] Advanced features based on feedback



---



## Security Considerations



- [ ] Row-level security (users only see their data)

- [ ] Rate limiting on API routes

- [ ] CSRF protection

- [ ] XSS prevention

- [ ] SQL injection prevention (via Prisma)

- [ ] Secure claim visibility (critical!)

- [x] GDPR compliance (EU users) - privacy policy, data export, data deletion, contact form

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
8. **"Someone joined" email notification** - Keep owners informed
9. **More in-app notification triggers** - Item claimed, wishlist added, etc.

### Lower Priority (Growth Phase)
10. ~~**Admin dashboard** - Monitor platform usage~~ ✅ Complete
11. **Analytics integration** - Track user behavior
12. **Premium tier + Stripe** - Monetization
13. **Push notifications** - PWA already configured

### Quick Wins
- ~~Contact form with admin management~~ ✅ Complete
- Add image upload (currently URL-only)
- Redraw capability for Secret Santa
- "Someone joined" email notification

---

*Document Version: 1.7*

*Last Updated: December 31, 2024*
