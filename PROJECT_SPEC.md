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

- [ ] Email/password registration

- [ ] OAuth (Google, Apple, Facebook)

- [ ] Email verification

- [ ] Password reset flow

- [ ] User profile (name, avatar, notification preferences)

- [ ] Account deletion (GDPR compliance)



### Bubbles (Groups)

- [ ] Create bubble with name, occasion type, date, description

- [ ] Bubble settings:

    - Budget range (min/max gift value)

    - Secret Santa mode (random assignment)

    - Allow external wishlists

    - Public/private visibility

- [ ] Invite members via email (bulk invite)

- [ ] Invitation link (shareable URL)

- [ ] Member management (remove members, transfer ownership)

- [ ] Bubble chat/comments

- [ ] Event countdown



### Wishlists

- [ ] Create wishlist items:

    - Title (required)

    - Description

    - Price / Price range

    - URL to product

    - Image (upload or URL scrape)

    - Priority (must-have, nice-to-have, dream)

    - Quantity (for items you want multiples of)

    - Notes for gifters

- [ ] Auto-scrape product info from URL (title, image, price)

- [ ] Categorize items

- [ ] Reorder items (drag & drop)

- [ ] Attach wishlist to multiple bubbles

- [ ] Wishlist templates (birthday, christmas, etc.)



### Claim System (The Secret Sauce)

- [ ] Claim item → reserves it for you

- [ ] Claim visible to all EXCEPT wishlist owner

- [ ] Mark as purchased

- [ ] Unclaim functionality

- [ ] Claim expiration (auto-release after X days without purchase)

- [ ] Partial claims (for group gifts or quantity items)

- [ ] Claim history/audit log (admin only)



### Secret Santa Features

- [ ] Random name draw within bubble

- [ ] Exclusion rules (couples shouldn't draw each other)

- [ ] Reveal assigned person privately

- [ ] Optional: set draw date

- [ ] Redraw capability (admin)



### Notifications

- [ ] Email notifications:

    - Bubble invitation

    - Someone joined your bubble

    - Reminder to add wishlist

    - Event approaching reminder

    - Secret Santa draw completed

    - Weekly digest of bubble activity

- [ ] In-app notifications

- [ ] Push notifications (PWA)

- [ ] Notification preferences per bubble



### Admin Dashboard

- [ ] User management (search, view, suspend, delete)

- [ ] Bubble oversight

- [ ] Content moderation

- [ ] System statistics:

    - Total users, active users

    - Total bubbles, active bubbles

    - Total wishlist items

    - Conversion funnels

    - User retention

- [ ] Email campaign management

- [ ] Feature flags

- [ ] Announcement system



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



### Phase 1: MVP (4-6 weeks)

- [ ] User authentication

- [ ] Create/join bubbles

- [ ] Basic wishlist CRUD

- [ ] Claim system

- [ ] Email invitations

- [ ] Basic responsive UI



### Phase 2: Core Features (4-6 weeks)

- [ ] Secret Santa draw

- [ ] URL scraping for products

- [ ] Notification system

- [ ] User profiles

- [ ] Bubble settings



### Phase 3: Polish & Launch (2-4 weeks)

- [ ] Admin dashboard

- [ ] Analytics integration

- [ ] Google AdSense integration

- [ ] Performance optimization

- [ ] SEO optimization

- [ ] Beta testing



### Phase 4: Growth Features (Ongoing)

- [ ] Premium tier implementation

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

- [ ] GDPR compliance (EU users)

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



## Next Steps



1. **Validate concept** - Quick landing page to gauge interest

2. **Design system** - Create Figma mockups

3. **Setup project** - Initialize Next.js + Supabase

4. **Build MVP** - Focus on core loop first

5. **Beta launch** - Friends & family testing

6. **Iterate** - Based on feedback

7. **Public launch** - Marketing push



---



*Document Version: 1.0*

*Last Updated: December 2024*
