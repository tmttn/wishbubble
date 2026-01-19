# Product Search Page Design

**Date:** 2026-01-19
**Status:** Approved

## Overview

Add a dedicated product search page (`/search`) as an alternative to the existing add-item dialog. This provides users with a more functional search experience featuring better visibility, filtering, and category browsing.

### Problem Statement

The current add-item dialog has limitations:
- Search results appear in a small dropdown (256px max height)
- No filtering options (price, category)
- Poor discoverability - users can only search by name, not browse categories

### Solution

A full-page search experience that complements (not replaces) the existing quick-add dialog.

## User Flow

1. User navigates to `/search` via main navigation or link from add-item dialog
2. User browses categories or enters a search query
3. User applies filters (price range, sort)
4. User clicks "Add to Wishlist" on a product
5. User selects target wishlist from popover/bottom sheet
6. Item is added, success toast shown

## Page Structure

```
┌─────────────────────────────────────────────────────────┐
│  Header: "Find Products"                                │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Search input (full width)                       │   │
│  └─────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│  Category chips (horizontal scroll on mobile)           │
│  [All] [Electronics] [Fashion] [Home] [Toys] ...       │
├─────────────────────────────────────────────────────────┤
│  Filters bar: Price range | Sort dropdown | View toggle │
├─────────────────────────────────────────────────────────┤
│  Results grid/list                                      │
│  (with infinite scroll)                                 │
└─────────────────────────────────────────────────────────┘
```

## Predefined Categories

- Electronics
- Fashion & Clothing
- Home & Living
- Toys & Games
- Books & Media
- Beauty & Personal Care
- Sports & Outdoors
- Kitchen & Dining

## Product Cards

### Grid View
```
┌──────────────────────┐
│  ┌────────────────┐  │
│  │                │  │
│  │     Image      │  │
│  │                │  │
│  └────────────────┘  │
│  Product Title       │
│  (2 lines max)       │
│  ★ 4.5 (123)        │
│  €49.99             │
│  [+ Add to Wishlist] │
└──────────────────────┘
```

### List View
```
┌─────────────────────────────────────────────────────────┐
│  ┌────────┐  Product Title                    €49.99   │
│  │ Image  │  Short description...             ★ 4.5    │
│  └────────┘  Brand name              [+ Add to Wishlist]│
└─────────────────────────────────────────────────────────┘
```

## Quick Add Flow

1. User clicks "Add to Wishlist" button
2. Popover (desktop) or bottom sheet (mobile) appears with wishlist dropdown
3. User selects a wishlist → item is added immediately
4. Success toast: "Added to [Wishlist Name]" with link to view
5. Button shows checkmark briefly, then resets

### Edge Cases
- **No wishlists:** Show "Create a wishlist first" with link
- **Single wishlist:** Skip dropdown, add directly with confirmation

## Mobile Responsiveness

### Search & Header
- Search input full width, 44px+ height for touch
- Sticky header for persistent access

### Category Chips
- Horizontal scroll (single row, no wrap)
- Min 44px touch targets
- Active state visually distinct

### Filters
```
┌─────────────────────────────────────┐
│ [Filter ▼]  [Sort ▼]  [Grid│List]  │
└─────────────────────────────────────┘
```
- Filter/Sort buttons open bottom sheets
- View toggle remains inline

### Product Grid
- 2 columns on mobile (< 640px)
- Full-width add button on cards

### Quick Add
- Bottom sheet instead of popover
- Large touch targets for wishlist selection

### Pagination
- Infinite scroll preferred
- "Load more" button as fallback

## Technical Implementation

### New Files
```
src/app/(main)/search/page.tsx        # Server component, page shell
src/components/search/
  ├── search-page-client.tsx          # Main client component
  ├── search-filters.tsx              # Filter controls (price, sort)
  ├── search-categories.tsx           # Category chips
  ├── product-grid.tsx                # Grid/list view container
  ├── search-product-card.tsx         # Individual product card
  └── add-to-wishlist-popover.tsx     # Quick add UI
```

### Data Flow
- URL query params store state: `?q=headphones&category=electronics&sort=price_asc&minPrice=50`
- Makes searches shareable/bookmarkable
- Client component reads params, calls `/api/products/search`
- TanStack Query for caching and loading states

### API Changes
- Add `category` parameter to `/api/products/search`
- Categories map to search query modifiers for Typesense

### Reuse Existing
- `/api/products/search` endpoint (extend with category)
- Wishlist fetching hooks
- Item creation mutation
- UI components (Button, Select, Input, Popover, etc.)

### New Translations
- Search page title and placeholders
- Category names (8 categories, EN + NL)
- Filter labels
- Success/error messages

## Entry Points

1. **Main navigation:** "Browse" or "Search" link in header/mobile menu
2. **Add-item dialog:** "Need more options? Browse all products →"
3. **Empty wishlist:** "Browse products to add to your wishlist"

## URL Structure

- Base: `/search`
- With filters: `/search?q=coffee+maker&category=kitchen&sort=price_asc&minPrice=20&maxPrice=100`

## Out of Scope

- Product comparison features
- Provider/store filtering
- Saving searches or search history
