# Typesense Integration Design

## Overview

Replace the current PostgreSQL ILIKE-based product search with Typesense Cloud for improved performance and relevance. This addresses two problems:

1. **Performance**: Current search uses `ILIKE '%query%'` which requires full table scans on 122k products
2. **Relevance**: Current search has no relevance ranking - "iPhone" returns accessories as prominently as actual iPhones

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Search scope | Feed products only (122k) | Bol.com API not active; keeps architecture simple |
| Sync strategy | Hybrid (on-import + daily resync) | Real-time updates + safety net for drift |
| Deduplication | Show all versions | Only 30 EAN duplicates; 65% lack EANs anyway |
| Result ordering | By provider priority | Allows commission-based prioritization |
| Search fields | Title, Brand, Description | Standard e-commerce search pattern |
| Field weights | Title:3, Brand:2, Desc:1 | Title/brand most important for product search |
| Facets | Category, Brand, Price range | Most useful filters; can add more later |

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Feed Import    │────▶│  PostgreSQL      │────▶│  Typesense      │
│  (CSV/Awin)     │     │  (FeedProduct)   │     │  Cloud          │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │                         │
                               │                         │
                        ┌──────┴──────┐           ┌──────┴──────┐
                        │ Source of   │           │ Search      │
                        │ Truth       │           │ Index       │
                        └─────────────┘           └─────────────┘
                                                         │
                                                         ▼
                                                  ┌─────────────────┐
                                                  │  Search API     │
                                                  │  /api/products/ │
                                                  │  search         │
                                                  └─────────────────┘
```

**Key principles:**

- PostgreSQL remains source of truth for all product data
- Typesense is a derived search index, can be rebuilt anytime
- Sync is event-driven (on feed import) + scheduled (daily resync)
- Search API uses Typesense with PostgreSQL fallback

## Typesense Schema

```typescript
// Collection: "products"
{
  name: "products",
  fields: [
    // Searchable fields
    { name: "title", type: "string", facet: false },
    { name: "brand", type: "string", facet: true, optional: true },
    { name: "description", type: "string", facet: false, optional: true },

    // Filterable/Facetable fields
    { name: "category", type: "string", facet: true, optional: true },
    { name: "price", type: "float", facet: true, optional: true },
    { name: "availability", type: "string", facet: false, optional: true },

    // Sorting fields
    { name: "providerPriority", type: "int32" },

    // Metadata
    { name: "providerId", type: "string", facet: true },
    { name: "providerName", type: "string", facet: false },
    { name: "imageUrl", type: "string", facet: false, optional: true },
    { name: "url", type: "string", facet: false },
    { name: "affiliateUrl", type: "string", facet: false },
    { name: "currency", type: "string", facet: false, optional: true },
    { name: "ean", type: "string", facet: false, optional: true },
  ],
  default_sorting_field: "providerPriority"
}
```

Document ID: Use FeedProduct's database `id` for easy sync/updates.

## Sync Mechanism

### Real-time sync (on feed import)

After feed import saves to PostgreSQL, push to Typesense:

```typescript
async function onFeedImportComplete(providerId: string, products: FeedProduct[]) {
  const documents = products.map(p => toTypesenseDocument(p));
  await typesense.collections("products").documents().import(documents, {
    action: "upsert"
  });
}
```

### Scheduled full resync (daily cron)

Safety net that rebuilds from PostgreSQL:

```typescript
async function fullResync() {
  // 1. Fetch all FeedProducts with provider info
  // 2. Batch upsert to Typesense (1000 docs per batch)
  // 3. Delete orphaned documents (in Typesense but not in DB)
}
```

### Deletion handling

- On feed import: Products removed from feed get deleted from Typesense
- Daily resync: Compares IDs, removes orphans

### Error handling

- Failed syncs logged to console/Sentry
- Search falls back to PostgreSQL if Typesense unreachable
- Daily resync self-heals inconsistencies

## Search API

### New flow

```
/api/products/search → Registry → TypesenseProvider → Typesense Cloud
                                         ↓ (fallback)
                                  AwinProvider → PostgreSQL
```

### TypesenseProvider implementation

```typescript
class TypesenseProvider implements SearchProvider {
  async search(query: string, options: SearchOptions): Promise<SearchResult> {
    const results = await typesense.collections("products").documents().search({
      q: query,
      query_by: "title,brand,description",
      query_by_weights: "3,2,1",
      filter_by: this.buildFilters(options),
      sort_by: "_text_match:desc,providerPriority:desc",
      per_page: options.pageSize,
      page: options.page,
      facet_by: "category,brand,price",
    });

    return this.mapToSearchResult(results);
  }
}
```

### Response changes

- Add `facets` field with category/brand/price counts
- Existing fields unchanged (backwards compatible)

## File Structure

```
src/lib/
├── typesense/
│   ├── client.ts           # Typesense client initialization
│   ├── schema.ts           # Collection schema definition
│   ├── sync.ts             # Sync service
│   └── index.ts            # Exports

src/lib/product-search/providers/
│   └── typesense.ts        # TypesenseProvider

src/app/api/cron/
│   └── typesense-resync/
│       └── route.ts        # Daily resync endpoint
```

## Environment Variables

```
TYPESENSE_HOST=xxx.typesense.net
TYPESENSE_API_KEY=your-api-key
TYPESENSE_ENABLED=true
```

## Implementation Order

1. Set up Typesense client & schema
2. Build sync service with batch upsert
3. Run initial full sync (122k products)
4. Create TypesenseProvider
5. Wire into search registry (with fallback)
6. Add cron endpoint for daily resync
7. Test & verify search quality
8. Remove feature flag, make default
