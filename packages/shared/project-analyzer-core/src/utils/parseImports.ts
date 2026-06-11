/**
 * Shape of a single import/re-export statement extracted from a source
 * file. `symbols` is normalised for display: default imports show as
 * `"default"`, namespace imports as `"* as <localName>"`, named
 * imports/re-exports show their *imported* name (the left side of
 * `as`), aliases are dropped because they have no meaning to readers
 * of the *other* file.
 */
export interface ParsedImport {
  /** The raw module specifier — exactly what appeared after `from`. */
  source: string;
  /** Imported binding names suitable for display, deduplicated. */
  symbols: string[];
  /** True for `import type ...` / `export type ...` and `{ type X }` forms only. */
  isTypeOnly: boolean;
  /** True for bare side-effect imports like `import "./polyfill"`. */
  isSideEffectOnly: boolean;
}

/**
 * Strips `//`-style and `/* … *\/` comments so the import regex
 * doesn't trip on the word `import` inside comments. String literals
 * are intentionally left intact — accidentally hitting one is rare in
 * practice and avoiding it would require a full tokenizer.
 */
function stripComments(source: string): string {
  let output = "";
  let index = 0;
  while (index < source.length) {
    const two = source.slice(index, index + 2);
    if (two === "//") {
      const newline = source.indexOf("\n", index);
      if (newline === -1) {
        break;
      }
      output += " ".repeat(newline - index);
      index = newline;
      continue;
    }
    if (two === "/*") {
      const end = source.indexOf("*/", index + 2);
      if (end === -1) {
        break;
      }
      const length = end + 2 - index;
      output += " ".repeat(length);
      index = end + 2;
      continue;
    }
    output += source[index];
    index += 1;
  }
  return output;
}

/**
 * Parses a single named-bindings clause (the part inside `{ … }`).
 * Strips alias halves (`a as b` → `a`), preserves inline `type`
 * specifiers as type-only markers on the symbol itself, and ignores
 * empty entries from trailing commas.
 */
function parseBracedClause(clause: string): {
  symbols: string[];
  allTypeOnly: boolean;
} {
  const entries = clause
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
  if (entries.length === 0) {
    return { symbols: [], allTypeOnly: false };
  }
  let allTypeOnly = true;
  const symbols: string[] = [];
  for (const entry of entries) {
    const typePrefixed = entry.startsWith("type ");
    const body = typePrefixed ? entry.slice(5).trim() : entry;
    if (!typePrefixed) {
      allTypeOnly = false;
    }
    const asMatch = body.match(/^([A-Za-z_$][\w$]*)\s+as\s+[A-Za-z_$][\w$]*$/);
    const name = asMatch ? asMatch[1] : body;
    if (/^[A-Za-z_$][\w$]*$/.test(name)) {
      symbols.push(name);
    }
  }
  return { symbols, allTypeOnly };
}

/**
 * Parses the part of an import statement before `from`. Handles the
 * five canonical shapes the spec allows:
 *
 *   import X from "…"
 *   import { a, b as c } from "…"
 *   import X, { a, b } from "…"
 *   import * as X from "…"
 *   import X, * as Y from "…"
 *
 * Returns the discovered binding names (default → `"default"`,
 * namespace → `"* as <local>"`, named → imported name) plus whether
 * every binding was type-only.
 */
function parseDefaultAndNamespace(clause: string): {
  symbols: string[];
  allTypeOnly: boolean;
} {
  const symbols: string[] = [];
  let allTypeOnly = true;

  const bracedMatch = clause.match(/\{([\s\S]*?)\}/);
  let bracedSegment: string | undefined;
  let prefix = clause;
  if (bracedMatch) {
    prefix = clause.slice(0, bracedMatch.index).trim();
    bracedSegment = bracedMatch[1];
  }

  for (const partRaw of prefix.split(",")) {
    const part = partRaw.trim();
    if (part.length === 0) {
      continue;
    }
    const namespaceMatch = part.match(/^\*\s+as\s+([A-Za-z_$][\w$]*)$/);
    if (namespaceMatch) {
      symbols.push(`* as ${namespaceMatch[1]}`);
      allTypeOnly = false;
      continue;
    }
    if (/^[A-Za-z_$][\w$]*$/.test(part)) {
      symbols.push("default");
      allTypeOnly = false;
      continue;
    }
  }

  if (bracedSegment !== undefined) {
    const { symbols: namedSymbols, allTypeOnly: namedTypeOnly } =
      parseBracedClause(bracedSegment);
    symbols.push(...namedSymbols);
    if (!namedTypeOnly) {
      allTypeOnly = false;
    }
  }

  return { symbols, allTypeOnly };
}

/**
 * Extracts every static `import` and `export … from` declaration from
 * a TypeScript / JavaScript source string. Dynamic `import(...)`
 * expressions and CommonJS `require()` calls are intentionally not
 * matched — madge has already done that work for us at the file-graph
 * level; this parser only needs to map a known file-to-file edge back
 * to the binding names that travel along it.
 */
export function parseImports(source: string): ParsedImport[] {
  const cleaned = stripComments(source);
  const results: ParsedImport[] = [];

  // `import "src"` — side-effect-only, no bindings.
  const sideEffectRegex = /\bimport\s+["']([^"']+)["']\s*;?/g;
  for (
    let match: RegExpExecArray | null;
    (match = sideEffectRegex.exec(cleaned));
  ) {
    results.push({
      source: match[1],
      symbols: [],
      isTypeOnly: false,
      isSideEffectOnly: true,
    });
  }

  // `import [type] <clause> from "src"`
  const importRegex =
    /\bimport\s+(type\s+)?([\s\S]*?)\s+from\s+["']([^"']+)["']/g;
  for (
    let match: RegExpExecArray | null;
    (match = importRegex.exec(cleaned));
  ) {
    const typeOnlyKeyword = Boolean(match[1]);
    const clause = match[2].trim();
    const source = match[3];
    const { symbols, allTypeOnly } = parseDefaultAndNamespace(clause);
    results.push({
      source,
      symbols: dedupe(symbols),
      isTypeOnly: typeOnlyKeyword || (symbols.length > 0 && allTypeOnly),
      isSideEffectOnly: false,
    });
  }

  // `export [type] { a, b } from "src"` and `export * from "src"`
  const reexportNamedRegex =
    /\bexport\s+(type\s+)?\{([\s\S]*?)\}\s+from\s+["']([^"']+)["']/g;
  for (
    let match: RegExpExecArray | null;
    (match = reexportNamedRegex.exec(cleaned));
  ) {
    const typeOnlyKeyword = Boolean(match[1]);
    const { symbols, allTypeOnly } = parseBracedClause(match[2]);
    results.push({
      source: match[3],
      symbols: dedupe(symbols),
      isTypeOnly: typeOnlyKeyword || (symbols.length > 0 && allTypeOnly),
      isSideEffectOnly: false,
    });
  }

  const reexportStarRegex =
    /\bexport\s+\*(?:\s+as\s+([A-Za-z_$][\w$]*))?\s+from\s+["']([^"']+)["']/g;
  for (
    let match: RegExpExecArray | null;
    (match = reexportStarRegex.exec(cleaned));
  ) {
    const namespace = match[1];
    results.push({
      source: match[2],
      symbols: [namespace ? `* as ${namespace}` : "*"],
      isTypeOnly: false,
      isSideEffectOnly: false,
    });
  }

  return results;
}

/** Returns `values` with duplicates removed, preserving order. */
function dedupe(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    if (!seen.has(value)) {
      seen.add(value);
      result.push(value);
    }
  }
  return result;
}
