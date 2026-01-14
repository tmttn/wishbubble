# Typed Translations Design

## Problem

Translation keys are not type-checked at compile time. Calling `t("nonexistent.key")` compiles without error but fails at runtime. With ~2,591 translation keys across 32 namespaces, missing or mistyped keys are a frequent source of bugs.

## Solution

Create a type-safe wrapper around `next-intl` that:
1. Generates TypeScript types from `messages/en.json`
2. Validates all locales have matching keys during generation
3. Provides autocomplete for translation keys within each namespace
4. Enforces correct interpolation parameters

## Architecture

```
messages/en.json  ──┐
messages/nl.json  ──┼──▶  scripts/generate-i18n-types.ts  ──▶  src/i18n/types.generated.ts
                    │                                                      │
                    │                                                      ▼
                    │                                         src/i18n/useTypedTranslations.ts
                    │                                                      │
                    ▼                                                      ▼
              Validates keys match                              Components use typed t()
```

## Generated Types Structure

```typescript
// src/i18n/types.generated.ts (auto-generated, do not edit)

export interface TranslationKeys {
  home: {
    "hero.title": never;  // no params
    "hero.subtitle": never;
  };
  notifications: {
    "messages.itemClaimed.title": { name: string };
    "messages.itemClaimed.body": { itemTitle: string; bubbleName: string };
  };
  plans: {
    "gated.requiresTier": { tier: string };
  };
  // ... all 32 namespaces
}

export type Namespace = keyof TranslationKeys;
```

- Each namespace maps to an object of `key → params`
- Keys with no params use `never`
- Params extracted by parsing `{paramName}` patterns
- Nested keys flattened to dot-notation

## Typed Hook

```typescript
// src/i18n/useTypedTranslations.ts
import { useTranslations } from "next-intl";
import type { TranslationKeys, Namespace } from "./types.generated";

type TranslationParams<N extends Namespace, K extends keyof TranslationKeys[N]> =
  TranslationKeys[N][K];

type TranslateFunction<N extends Namespace> = <K extends keyof TranslationKeys[N]>(
  key: K,
  ...args: TranslationParams<N, K> extends never ? [] : [params: TranslationParams<N, K>]
) => string;

export function useTypedTranslations<N extends Namespace>(
  namespace: N
): TranslateFunction<N> {
  const t = useTranslations(namespace);
  return t as TranslateFunction<N>;
}
```

## Generation Script

Located at `scripts/generate-i18n-types.ts`:

1. Load all locale files from `messages/`
2. Flatten nested keys to dot-notation
3. Compare all locales against English - error if keys don't match
4. Extract params from translation strings using regex
5. Generate TypeScript interface and write to `src/i18n/types.generated.ts`

### Validation Output

```
❌ Missing keys in nl.json:
   - home.hero.newFeature

❌ Extra keys in nl.json (not in en.json):
   - home.hero.oldFeature
```

## NPM Scripts

```json
{
  "generate:i18n-types": "tsx scripts/generate-i18n-types.ts",
  "build": "pnpm generate:i18n-types && next build"
}
```

## Migration Path

Gradual adoption - both hooks work side-by-side:

```typescript
// Before
import { useTranslations } from "next-intl";
const t = useTranslations("home");

// After
import { useTypedTranslations } from "@/i18n/useTypedTranslations";
const t = useTypedTranslations("home");
```

## Files Created

| Component | File |
|-----------|------|
| Generated types | `src/i18n/types.generated.ts` |
| Typed hook | `src/i18n/useTypedTranslations.ts` |
| Generation script | `scripts/generate-i18n-types.ts` |
