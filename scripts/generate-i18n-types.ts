/**
 * Generates TypeScript types from translation files.
 *
 * This script:
 * 1. Loads all locale files from messages/
 * 2. Validates that all locales have matching keys
 * 3. Extracts interpolation parameters from translation strings
 * 4. Generates a typed interface for use with useTypedTranslations
 *
 * Supports nested namespaces like "admin.announcements" or "auth.login"
 *
 * Run with: pnpm generate:i18n-types
 */

import * as fs from "fs";
import * as path from "path";

const MESSAGES_DIR = path.join(process.cwd(), "messages");
const OUTPUT_FILE = path.join(process.cwd(), "src/i18n/types.generated.ts");
const SOURCE_LOCALE = "en";

type TranslationValue = string | { [key: string]: TranslationValue };
type TranslationFile = { [key: string]: TranslationValue };

interface FlattenedTranslations {
  [key: string]: string;
}

/**
 * Represents a node in the namespace tree.
 * Each node can have both keys (leaf translations) and children (sub-namespaces).
 */
interface NamespaceNode {
  keys: { [key: string]: string[] }; // key -> params
  children: { [name: string]: NamespaceNode };
}

/**
 * Flatten nested translation object to dot-notation keys
 */
function flattenTranslations(
  obj: TranslationValue,
  prefix = ""
): FlattenedTranslations {
  const result: FlattenedTranslations = {};

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === "string") {
      result[fullKey] = value;
    } else {
      Object.assign(result, flattenTranslations(value, fullKey));
    }
  }

  return result;
}

/**
 * Extract parameter names from a translation string.
 * Handles both simple {param} and ICU plural {count, plural, ...} formats.
 *
 * ICU format examples:
 * - "{count} items" -> params: [count]
 * - "{count, plural, one {# item} other {# items}}" -> params: [count]
 * - "{name} has {count, plural, one {# gift} other {# gifts}}" -> params: [name, count]
 */
function extractParams(value: string): string[] {
  const params = new Set<string>();

  // First, extract ICU plural/select params: {count, plural, ...} or {gender, select, ...}
  const icuParamRegex = /\{(\w+),\s*(?:plural|select|selectordinal)/g;
  let match;
  while ((match = icuParamRegex.exec(value)) !== null) {
    params.add(match[1]);
  }

  // Remove ICU blocks to avoid matching literals inside them
  // ICU blocks are nested and look like: {name, plural, one {text} other {text}}
  // We need to handle nested braces properly
  let withoutIcu = value;
  let prevLength = -1;

  // Keep removing ICU blocks until no more changes (handles nested cases)
  while (withoutIcu.length !== prevLength) {
    prevLength = withoutIcu.length;
    // Match ICU blocks with their nested content
    // This regex matches: {word, plural/select/selectordinal, ... content with nested braces ...}
    withoutIcu = withoutIcu.replace(
      /\{\w+,\s*(?:plural|select|selectordinal),(?:[^{}]|\{[^{}]*\})*\}/g,
      ""
    );
  }

  // Now match simple params from the remaining text
  const simpleParamRegex = /\{(\w+)\}/g;
  while ((match = simpleParamRegex.exec(withoutIcu)) !== null) {
    params.add(match[1]);
  }

  return Array.from(params).sort();
}

/**
 * Load and parse a JSON translation file
 */
function loadTranslationFile(locale: string): TranslationFile {
  const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
  const content = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(content);
}

/**
 * Get all locale files in the messages directory
 */
function getLocales(): string[] {
  const files = fs.readdirSync(MESSAGES_DIR);
  return files
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(".json", ""));
}

/**
 * Validate that all locales have the same keys as the source locale
 */
function validateLocales(
  sourceKeys: Set<string>,
  localeKeys: Map<string, Set<string>>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const [locale, keys] of localeKeys) {
    if (locale === SOURCE_LOCALE) continue;

    const missing = [...sourceKeys].filter((k) => !keys.has(k));
    const extra = [...keys].filter((k) => !sourceKeys.has(k));

    if (missing.length > 0) {
      errors.push(`\n❌ Missing keys in ${locale}.json:`);
      missing.forEach((k) => errors.push(`   - ${k}`));
    }

    if (extra.length > 0) {
      errors.push(
        `\n❌ Extra keys in ${locale}.json (not in ${SOURCE_LOCALE}.json):`
      );
      extra.forEach((k) => errors.push(`   - ${k}`));
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Build a tree of namespaces from the translation file structure.
 * This allows us to support nested namespaces like "admin.announcements".
 */
function buildNamespaceTree(translations: TranslationFile): NamespaceNode {
  const root: NamespaceNode = { keys: {}, children: {} };

  function processNode(
    node: NamespaceNode,
    obj: TranslationValue,
    keyPrefix = ""
  ) {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "string") {
        // This is a leaf translation
        const fullKey = keyPrefix ? `${keyPrefix}.${key}` : key;
        node.keys[fullKey] = extractParams(value);
      } else {
        // This is a nested object - could be a sub-namespace or nested keys
        // Create child namespace
        if (!node.children[key]) {
          node.children[key] = { keys: {}, children: {} };
        }
        // Also add flattened keys to current node
        const flattened = flattenTranslations(value, key);
        for (const [flatKey, flatValue] of Object.entries(flattened)) {
          const fullKey = keyPrefix ? `${keyPrefix}.${flatKey}` : flatKey;
          node.keys[fullKey] = extractParams(flatValue);
        }
        // Recursively process child
        processNode(node.children[key], value, "");
      }
    }
  }

  processNode(root, translations);
  return root;
}

/**
 * Collect all possible namespace paths from the tree
 */
function collectNamespacePaths(
  node: NamespaceNode,
  prefix = ""
): Map<string, { [key: string]: string[] }> {
  const result = new Map<string, { [key: string]: string[] }>();

  // Add current namespace if it has keys
  if (Object.keys(node.keys).length > 0) {
    result.set(prefix || "_root", node.keys);
  }

  // Process children
  for (const [name, child] of Object.entries(node.children)) {
    const childPrefix = prefix ? `${prefix}.${name}` : name;
    const childPaths = collectNamespacePaths(child, childPrefix);
    for (const [path, keys] of childPaths) {
      result.set(path, keys);
    }
  }

  return result;
}

/**
 * Generate the TypeScript type definitions
 */
function generateTypeDefinitions(
  namespaces: Map<string, { [key: string]: string[] }>
): string {
  const lines: string[] = [
    "// This file is auto-generated by scripts/generate-i18n-types.ts",
    "// Do not edit manually. Run `pnpm generate:i18n-types` to regenerate.",
    "",
    "export interface TranslationKeys {",
  ];

  const sortedNamespaces = [...namespaces.keys()].sort();

  for (const namespace of sortedNamespaces) {
    if (namespace === "_root") continue; // Skip root-level keys without namespace

    const keys = namespaces.get(namespace)!;
    const sortedKeys = Object.keys(keys).sort();

    // Use quoted key for namespaces with dots
    const nsKey = namespace.includes(".") ? `"${namespace}"` : namespace;
    lines.push(`  ${nsKey}: {`);

    for (const key of sortedKeys) {
      const params = keys[key];

      if (params.length === 0) {
        lines.push(`    "${key}": never;`);
      } else {
        const paramTypes = params
          .map((p) => `${p}: string | number`)
          .join("; ");
        lines.push(`    "${key}": { ${paramTypes} };`);
      }
    }

    lines.push("  };");
  }

  lines.push("}");
  lines.push("");
  lines.push("export type Namespace = keyof TranslationKeys;");
  lines.push("");

  return lines.join("\n");
}

/**
 * Main execution
 */
function main() {
  console.log("🌐 Generating i18n types...\n");

  // Get all locales
  const locales = getLocales();
  console.log(`Found locales: ${locales.join(", ")}`);

  if (!locales.includes(SOURCE_LOCALE)) {
    console.error(`❌ Source locale "${SOURCE_LOCALE}" not found`);
    process.exit(1);
  }

  // Load and flatten all translation files for validation
  const localeKeys = new Map<string, Set<string>>();
  let sourceTranslations: TranslationFile = {};

  for (const locale of locales) {
    const translations = loadTranslationFile(locale);
    const flattened = flattenTranslations(translations);
    localeKeys.set(locale, new Set(Object.keys(flattened)));

    if (locale === SOURCE_LOCALE) {
      sourceTranslations = translations;
    }
  }

  const sourceKeys = localeKeys.get(SOURCE_LOCALE)!;
  console.log(`Total translation keys: ${sourceKeys.size}`);

  // Validate all locales match
  const { valid, errors } = validateLocales(sourceKeys, localeKeys);
  if (!valid) {
    console.error(errors.join("\n"));
    process.exit(1);
  }

  console.log("✅ All locales have matching keys\n");

  // Build namespace tree and collect all namespace paths
  const tree = buildNamespaceTree(sourceTranslations);
  const namespaces = collectNamespacePaths(tree);

  // Generate type definitions
  const typeDefinitions = generateTypeDefinitions(namespaces);

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write the type definitions
  fs.writeFileSync(OUTPUT_FILE, typeDefinitions);

  console.log(`✅ Generated types at ${OUTPUT_FILE}`);
  console.log(`   Namespaces: ${namespaces.size}`);
  console.log(`   Total keys: ${sourceKeys.size}`);
}

main();
