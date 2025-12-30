# Database Schema - WishBubble



## Overview



This schema is designed for PostgreSQL with Prisma ORM. Key design decisions:

- UUIDs for all primary keys (security, distributed-friendly)

- Soft deletes where appropriate

- Audit timestamps on all tables

- Row-level security ready



---



## Entity Relationship Diagram



```

┌──────────────────┐

│      User        │

├──────────────────┤

│ id (PK)          │

│ email            │

│ name             │

│ avatar_url       │

│ ...              │

└────────┬─────────┘

         │

         │ 1:N

         ▼

┌──────────────────┐         ┌──────────────────┐

│    Wishlist      │         │     Bubble       │

├──────────────────┤         ├──────────────────┤

│ id (PK)          │         │ id (PK)          │

│ user_id (FK)     │         │ name             │

│ name             │         │ occasion_type    │

│ ...              │         │ event_date       │

└────────┬─────────┘         │ owner_id (FK)    │

         │                   │ ...              │

         │ 1:N               └────────┬─────────┘

         ▼                            │

┌──────────────────┐                  │

│  WishlistItem    │                  │

├──────────────────┤         ┌────────┴─────────┐

│ id (PK)          │         │                  │

│ wishlist_id (FK) │         │ N:M              │

│ title            │         ▼                  ▼

│ ...              │  ┌──────────────────┐ ┌──────────────────┐

└────────┬─────────┘  │  BubbleMember    │ │ BubbleWishlist   │

         │            ├──────────────────┤ ├──────────────────┤

         │            │ bubble_id (FK)   │ │ bubble_id (FK)   │

         │ 1:N        │ user_id (FK)     │ │ wishlist_id (FK) │

         ▼            │ role             │ │ ...              │

┌──────────────────┐  │ ...              │ └──────────────────┘

│     Claim        │  └──────────────────┘

├──────────────────┤

│ id (PK)          │  ┌──────────────────┐

│ item_id (FK)     │  │ SecretSantaDraw  │

│ user_id (FK)     │  ├──────────────────┤

│ bubble_id (FK)   │  │ bubble_id (FK)   │

│ status           │  │ giver_id (FK)    │

│ ...              │  │ receiver_id (FK) │

└──────────────────┘  │ ...              │

                      └──────────────────┘

```



---



## Prisma Schema



```prisma

// prisma/schema.prisma

 

generator client {

  provider = "prisma-client-js"

}

 

datasource db {

  provider = "postgresql"

  url      = env("DATABASE_URL")

}

 

// ============================================

// USER & AUTHENTICATION

// ============================================

 

model User {

  id            String    @id @default(cuid())

  email         String    @unique

  emailVerified DateTime?

  passwordHash  String?   // null for OAuth users

  name          String?

  avatarUrl     String?

 

  // Preferences

  notifyEmail       Boolean @default(true)

  notifyInApp       Boolean @default(true)

  notifyDigest      Boolean @default(true) // Weekly digest

  digestDay         Int     @default(0)    // 0=Sunday, 1=Monday...

 

  // Subscription

  subscriptionTier  SubscriptionTier @default(FREE)

  subscriptionEnds  DateTime?

  stripeCustomerId  String?

 

  // Timestamps

  createdAt     DateTime  @default(now())

  updatedAt     DateTime  @updatedAt

  deletedAt     DateTime? // Soft delete

  lastLoginAt   DateTime?

 

  // Relations

  accounts        Account[]

  sessions        Session[]

  wishlists       Wishlist[]

  bubbleMemberships BubbleMember[]

  ownedBubbles    Bubble[]        @relation("BubbleOwner")

  claims          Claim[]

  secretSantaGiving   SecretSantaDraw[] @relation("Giver")

  secretSantaReceiving SecretSantaDraw[] @relation("Receiver")

  invitationsSent Invitation[]

  notifications   Notification[]

 

  @@index([email])

  @@index([deletedAt])

}

 

enum SubscriptionTier {

  FREE

  PREMIUM

  FAMILY

}

 

// NextAuth.js required models

model Account {

  id                String  @id @default(cuid())

  userId            String

  type              String

  provider          String

  providerAccountId String

  refresh_token     String? @db.Text

  access_token      String? @db.Text

  expires_at        Int?

  token_type        String?

  scope             String?

  id_token          String? @db.Text

  session_state     String?

 

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

 

  @@unique([provider, providerAccountId])

  @@index([userId])

}

 

model Session {

  id           String   @id @default(cuid())

  sessionToken String   @unique

  userId       String

  expires      DateTime

  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

 

  @@index([userId])

}

 

model VerificationToken {

  identifier String

  token      String   @unique

  expires    DateTime

 

  @@unique([identifier, token])

}

 

// ============================================

// BUBBLES (GROUPS)

// ============================================

 

model Bubble {

  id          String   @id @default(cuid())

  name        String

  description String?  @db.Text

  slug        String   @unique // URL-friendly identifier

 

  // Event details

  occasionType  OccasionType

  eventDate     DateTime?

 

  // Settings

  budgetMin       Decimal?  @db.Decimal(10, 2)

  budgetMax       Decimal?  @db.Decimal(10, 2)

  currency        String    @default("EUR")

  isSecretSanta   Boolean   @default(false)

  secretSantaDrawn Boolean  @default(false)

  allowExternalLinks Boolean @default(true)

  maxMembers      Int       @default(10)

  isPublic        Boolean   @default(false) // Discoverable?

 

  // Theme/Customization (Premium)

  themeColor    String?

  coverImageUrl String?

 

  // Ownership

  ownerId       String

  owner         User     @relation("BubbleOwner", fields: [ownerId], references: [id])

 

  // Timestamps

  createdAt     DateTime @default(now())

  updatedAt     DateTime @updatedAt

  archivedAt    DateTime? // Soft archive after event

 

  // Relations

  members       BubbleMember[]

  wishlists     BubbleWishlist[]

  secretSantaDraws SecretSantaDraw[]

  invitations   Invitation[]

  claims        Claim[]

  activities    Activity[]

 

  @@index([ownerId])

  @@index([slug])

  @@index([eventDate])

  @@index([archivedAt])

}

 

enum OccasionType {

  CHRISTMAS

  BIRTHDAY

  SINTERKLAAS

  WEDDING

  BABY_SHOWER

  GRADUATION

  HOUSEWARMING

  OTHER

}

 

model BubbleMember {

  id        String   @id @default(cuid())

  bubbleId  String

  userId    String

  role      BubbleRole @default(MEMBER)

 

  // Member preferences for this bubble

  notifyActivity Boolean @default(true)

 

  joinedAt  DateTime @default(now())

  leftAt    DateTime? // null = active member

 

  bubble    Bubble   @relation(fields: [bubbleId], references: [id], onDelete: Cascade)

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

 

  @@unique([bubbleId, userId])

  @@index([bubbleId])

  @@index([userId])

}

 

enum BubbleRole {

  OWNER

  ADMIN

  MEMBER

}

 

// ============================================

// WISHLISTS

// ============================================

 

model Wishlist {

  id          String   @id @default(cuid())

  userId      String

  name        String   @default("My Wishlist")

  description String?  @db.Text

  isDefault   Boolean  @default(false) // User's primary wishlist

 

  createdAt   DateTime @default(now())

  updatedAt   DateTime @updatedAt

 

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  items       WishlistItem[]

  bubbles     BubbleWishlist[]

 

  @@index([userId])

}

 

model BubbleWishlist {

  id          String   @id @default(cuid())

  bubbleId    String

  wishlistId  String

 

  // Visibility within bubble

  isVisible   Boolean  @default(true)

 

  attachedAt  DateTime @default(now())

 

  bubble      Bubble   @relation(fields: [bubbleId], references: [id], onDelete: Cascade)

  wishlist    Wishlist @relation(fields: [wishlistId], references: [id], onDelete: Cascade)

 

  @@unique([bubbleId, wishlistId])

  @@index([bubbleId])

  @@index([wishlistId])

}

 

model WishlistItem {

  id          String   @id @default(cuid())

  wishlistId  String

 

  // Item details

  title       String

  description String?  @db.Text

 

  // Price

  price       Decimal? @db.Decimal(10, 2)

  priceMax    Decimal? @db.Decimal(10, 2) // For ranges

  currency    String   @default("EUR")

 

  // Product link

  url         String?  @db.Text

  imageUrl    String?

 

  // Metadata

  priority    ItemPriority @default(NICE_TO_HAVE)

  quantity    Int          @default(1)  // How many they want

  category    String?

  notes       String?      @db.Text     // Notes for gifters

 

  // Ordering

  sortOrder   Int          @default(0)

 

  // Timestamps

  createdAt   DateTime @default(now())

  updatedAt   DateTime @updatedAt

  deletedAt   DateTime? // Soft delete

 

  wishlist    Wishlist @relation(fields: [wishlistId], references: [id], onDelete: Cascade)

  claims      Claim[]

 

  @@index([wishlistId])

  @@index([deletedAt])

}

 

enum ItemPriority {

  MUST_HAVE

  NICE_TO_HAVE

  DREAM

}

 

// ============================================

// CLAIMS (THE SECRET SAUCE)

// ============================================

 

model Claim {

  id          String   @id @default(cuid())

  itemId      String

  userId      String   // Who claimed it

  bubbleId    String   // Context of the claim

 

  status      ClaimStatus @default(CLAIMED)

  quantity    Int         @default(1) // For items with quantity > 1

 

  // For group gifts

  isGroupGift   Boolean   @default(false)

  contribution  Decimal?  @db.Decimal(10, 2)

 

  claimedAt   DateTime  @default(now())

  purchasedAt DateTime?

  unclaimedAt DateTime? // If they unclaimed

 

  // Auto-expiration

  expiresAt   DateTime? // Claim expires if not purchased

 

  item        WishlistItem @relation(fields: [itemId], references: [id], onDelete: Cascade)

  user        User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  bubble      Bubble       @relation(fields: [bubbleId], references: [id], onDelete: Cascade)

 

  @@index([itemId])

  @@index([userId])

  @@index([bubbleId])

  @@index([status])

}

 

enum ClaimStatus {

  CLAIMED

  PURCHASED

  UNCLAIMED

}

 

// ============================================

// SECRET SANTA

// ============================================

 

model SecretSantaDraw {

  id          String   @id @default(cuid())

  bubbleId    String

  giverId     String   // Who gives

  receiverId  String   // Who receives

 

  // Exclusions that were applied

  excludedUserIds String[] // Users this giver couldn't be matched with

 

  drawnAt     DateTime @default(now())

  viewedAt    DateTime? // When giver first saw their assignment

 

  bubble      Bubble   @relation(fields: [bubbleId], references: [id], onDelete: Cascade)

  giver       User     @relation("Giver", fields: [giverId], references: [id])

  receiver    User     @relation("Receiver", fields: [receiverId], references: [id])

 

  @@unique([bubbleId, giverId]) // One giver per bubble

  @@unique([bubbleId, receiverId]) // One receiver per bubble

  @@index([bubbleId])

  @@index([giverId])

}

 

// Exclusion rules for Secret Santa

model SecretSantaExclusion {

  id          String   @id @default(cuid())

  bubbleId    String

  userId1     String   // These two users

  userId2     String   // shouldn't draw each other

 

  createdAt   DateTime @default(now())

 

  @@unique([bubbleId, userId1, userId2])

  @@index([bubbleId])

}

 

// ============================================

// INVITATIONS

// ============================================

 

model Invitation {

  id          String   @id @default(cuid())

  bubbleId    String

  email       String

  invitedBy   String

 

  token       String   @unique @default(cuid())

  status      InvitationStatus @default(PENDING)

 

  sentAt      DateTime @default(now())

  expiresAt   DateTime

  acceptedAt  DateTime?

 

  bubble      Bubble   @relation(fields: [bubbleId], references: [id], onDelete: Cascade)

  inviter     User     @relation(fields: [invitedBy], references: [id])

 

  @@index([bubbleId])

  @@index([email])

  @@index([token])

}

 

enum InvitationStatus {

  PENDING

  ACCEPTED

  EXPIRED

  CANCELLED

}

 

// ============================================

// NOTIFICATIONS

// ============================================

 

model Notification {

  id          String   @id @default(cuid())

  userId      String

 

  type        NotificationType

  title       String

  body        String   @db.Text

 

  // Link to related entity

  bubbleId    String?

  itemId      String?

 

  // Metadata

  data        Json?

 

  readAt      DateTime?

  createdAt   DateTime @default(now())

 

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

 

  @@index([userId])

  @@index([readAt])

  @@index([createdAt])

}

 

enum NotificationType {

  BUBBLE_INVITATION

  MEMBER_JOINED

  WISHLIST_ADDED

  REMINDER_ADD_WISHLIST

  EVENT_APPROACHING

  SECRET_SANTA_DRAWN

  ITEM_CLAIMED     // Only visible to non-owners

  SYSTEM

}

 

// ============================================

// ACTIVITY FEED

// ============================================

 

model Activity {

  id          String   @id @default(cuid())

  bubbleId    String

  userId      String?  // null for system activities

 

  type        ActivityType

  metadata    Json?

 

  createdAt   DateTime @default(now())

 

  bubble      Bubble   @relation(fields: [bubbleId], references: [id], onDelete: Cascade)

 

  @@index([bubbleId])

  @@index([createdAt])

}

 

enum ActivityType {

  MEMBER_JOINED

  MEMBER_LEFT

  WISHLIST_ATTACHED

  ITEM_ADDED

  SECRET_SANTA_DRAWN

  EVENT_APPROACHING

}

 

// ============================================

// ADMIN & ANALYTICS

// ============================================

 

model AdminUser {

  id          String   @id @default(cuid())

  email       String   @unique

  passwordHash String

  role        AdminRole @default(MODERATOR)

 

  createdAt   DateTime @default(now())

  lastLoginAt DateTime?

 

  @@index([email])

}

 

enum AdminRole {

  SUPER_ADMIN

  ADMIN

  MODERATOR

}

 

model SystemStats {

  id          String   @id @default(cuid())

  date        DateTime @db.Date @unique

 

  totalUsers      Int

  activeUsers     Int // Users active in last 30 days

  newUsers        Int // New users today

 

  totalBubbles    Int

  activeBubbles   Int // Bubbles with activity in last 30 days

  newBubbles      Int

 

  totalItems      Int

  totalClaims     Int

 

  premiumUsers    Int

  revenue         Decimal? @db.Decimal(10, 2)

 

  @@index([date])

}

 

// Feature flags for gradual rollout

model FeatureFlag {

  id          String   @id @default(cuid())

  key         String   @unique

  description String?

 

  enabled     Boolean  @default(false)

  enabledFor  String[] // User IDs or "all" or percentage

 

  createdAt   DateTime @default(now())

  updatedAt   DateTime @updatedAt

}

 

// ============================================

// URL SCRAPING CACHE

// ============================================

 

model ScrapedProduct {

  id          String   @id @default(cuid())

  url         String   @unique

 

  title       String?

  description String?  @db.Text

  price       Decimal? @db.Decimal(10, 2)

  currency    String?

  imageUrl    String?

 

  scrapedAt   DateTime @default(now())

  expiresAt   DateTime // Cache expiration

 

  @@index([url])

  @@index([expiresAt])

}

```



---



## Key Security: Claim Visibility



The claim system requires **careful API design** to prevent the wishlist owner from seeing claims:



### API Route Strategy



```typescript

// ❌ WRONG: Single endpoint that filters based on user

// Owner could intercept the full response

 

// ✅ CORRECT: Separate endpoints with different data

 

// For wishlist owner viewing their own list

// GET /api/wishlist/:id/items

// Returns: items WITHOUT claim data

 

// For bubble members viewing someone else's list

// GET /api/bubble/:bubbleId/wishlist/:wishlistId/items

// Returns: items WITH claim data (if not the owner)

```



### Database Query Strategy



```typescript

// When owner views their wishlist

const items = await prisma.wishlistItem.findMany({

  where: { wishlistId },

  // NO claim relation included

});

 

// When others view a wishlist in a bubble

const items = await prisma.wishlistItem.findMany({

  where: { wishlistId },

  include: {

    claims: {

      where: { bubbleId },

      include: { user: { select: { id: true, name: true, avatarUrl: true } } }

    }

  }

});

```



---



## Indexes Strategy



Critical indexes for performance:



```sql

-- User lookups

CREATE INDEX idx_user_email ON "User"(email);

 

-- Bubble queries

CREATE INDEX idx_bubble_member ON "BubbleMember"(bubble_id, user_id);

CREATE INDEX idx_bubble_slug ON "Bubble"(slug);

 

-- Wishlist items

CREATE INDEX idx_wishlist_items ON "WishlistItem"(wishlist_id, deleted_at);

 

-- Claims (most queried)

CREATE INDEX idx_claims_item ON "Claim"(item_id, status);

CREATE INDEX idx_claims_bubble ON "Claim"(bubble_id);

CREATE INDEX idx_claims_user ON "Claim"(user_id);

 

-- Notifications

CREATE INDEX idx_notifications_user ON "Notification"(user_id, read_at);

```



---



## Migration Notes



1. **Initial Setup**: Run `prisma migrate dev` after creating schema

2. **Seed Data**: Create seed script for development

3. **Production**: Use `prisma migrate deploy` for production migrations



---



*Schema Version: 1.0*
