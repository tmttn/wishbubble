import { useTranslations } from "next-intl";
import type { TranslationKeys, Namespace } from "./types.generated";

/**
 * Get the parameter type for a specific translation key.
 * Returns `never` if the key has no parameters.
 */
type TranslationParams<
  N extends Namespace,
  K extends keyof TranslationKeys[N],
> = TranslationKeys[N][K];

/**
 * A typed translation function for a specific namespace.
 * - If a key has no parameters, call as `t("key")`
 * - If a key has parameters, call as `t("key", { param1: "value" })`
 */
type TranslateFunction<N extends Namespace> = <
  K extends keyof TranslationKeys[N] & string,
>(
  key: K,
  ...args: TranslationParams<N, K> extends never
    ? []
    : [params: TranslationParams<N, K>]
) => string;

/**
 * A type-safe wrapper around next-intl's useTranslations hook.
 *
 * Provides compile-time validation of:
 * - Translation key existence within the namespace
 * - Required interpolation parameters
 *
 * @example
 * ```tsx
 * const t = useTypedTranslations("home");
 *
 * // ✅ Valid - key exists, no params needed
 * t("hero.title")
 *
 * // ✅ Valid - key exists with required params
 * t("hero.welcome", { name: "Tom" })
 *
 * // ❌ Type error - key doesn't exist
 * t("fake.key")
 *
 * // ❌ Type error - missing required params
 * t("hero.welcome")
 * ```
 */
export function useTypedTranslations<N extends Namespace>(
  namespace: N
): TranslateFunction<N> {
  const t = useTranslations(namespace);
  return t as unknown as TranslateFunction<N>;
}

/**
 * Export the TranslateFunction type for use in component props.
 *
 * @example
 * ```tsx
 * interface Props {
 *   t: TypedTranslateFunction<"admin.nav">;
 * }
 * ```
 */
export type TypedTranslateFunction<N extends Namespace> = TranslateFunction<N>;

/**
 * Re-export Namespace type for use in type assertions.
 */
export type { Namespace, TranslationKeys };
