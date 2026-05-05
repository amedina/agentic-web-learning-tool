/**
 * External dependencies.
 */
import type { PackageStats } from "@agentic-web-labs/package-analyzer-core";

export interface ContextDependency {
  name: string;
  /** "dependencies" / "devDependencies" / "peerDependencies". */
  category: string;
  /** PackageStats from the host cache, or null when nothing is known. */
  stats: PackageStats | null;
}

export interface BuildContextInput {
  /** The user's free-text question to the chat participant. */
  prompt: string;
  /** Workspace-relative path of the active package.json, e.g. "packages/foo/package.json". */
  activeFileRelativePath: string | null;
  /** `name` field from the active package.json, when present. */
  activeFileName: string | null;
  /** Every dep + cached stats from the active package.json. */
  dependencies: ContextDependency[];
}

const NPM_NAME_PATTERN =
  /(?:@[a-z0-9-_~][a-z0-9-_.~]*\/)?[a-z0-9-_~][a-z0-9-_.~]*/g;
const STOP_WORDS = new Set([
  "and",
  "are",
  "for",
  "from",
  "have",
  "is",
  "its",
  "my",
  "of",
  "on",
  "or",
  "package",
  "packages",
  "should",
  "the",
  "this",
  "to",
  "with",
  "what",
  "why",
  "how",
  "can",
  "do",
  "does",
  "any",
  "in",
  "it",
  "be",
  "an",
  "a",
  "as",
  "at",
  "if",
  "so",
  "i",
  "u",
  "r",
  "y",
  "tell",
  "me",
  "about",
  "give",
  "show",
  "list",
  "compare",
  "vs",
  "versus",
  "score",
  "scores",
  "license",
  "licenses",
  "vulnerability",
  "vulnerabilities",
  "alternative",
  "alternatives",
]);

/**
 * Extracts npm-name-shaped tokens from free-text user input. Returns
 * lowercased candidates with stop-words filtered out; preserves order
 * of first appearance and dedupes. Used both by the context builder
 * (to know which deps to fully expand) and by the chat handler (to
 * know which non-workspace packages to fetch on demand).
 *
 * Common English stop-words and intent words ("compare", "score",
 * etc.) are filtered out so a question like "compare lodash vs
 * underscore" yields ["lodash", "underscore"] rather than every word.
 */
export function extractCandidatePackageNames(prompt: string): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];
  for (const match of prompt.toLowerCase().matchAll(NPM_NAME_PATTERN)) {
    const token = match[0];
    if (STOP_WORDS.has(token)) {
      continue;
    }
    if (seen.has(token)) {
      continue;
    }
    seen.add(token);
    ordered.push(token);
  }
  return ordered;
}

/**
 * Builds the markdown context block handed to the chat model alongside
 * the user's prompt. Strategy:
 *   1. Always include the active package.json (path + parsed `name`).
 *   2. Always include a one-line summary of every dep (name + category
 *      + score), so the model can answer cross-cutting questions like
 *      "list packages with low scores" without an extra round-trip.
 *   3. For any dep the user mentioned by name in the prompt, expand
 *      to a full stats block (vulnerabilities, license, bundle, etc.).
 * Result is plain markdown so it renders nicely in the chat panel
 * when echoed back.
 */
export function buildPackageContext(input: BuildContextInput): string {
  const sections: string[] = [];

  if (input.activeFileRelativePath || input.activeFileName) {
    const headerParts = [
      input.activeFileName ? `**${input.activeFileName}**` : null,
      input.activeFileRelativePath ? `(${input.activeFileRelativePath})` : null,
    ].filter(Boolean);
    sections.push(`### Active package.json\n${headerParts.join(" ")}`);
  } else {
    sections.push(
      "### Active package.json\n_No package.json is currently focused in the editor._",
    );
  }

  if (input.dependencies.length === 0) {
    sections.push(
      "### Dependencies\n_The active package.json has no declared dependencies._",
    );
  } else {
    const lines = input.dependencies.map((entry) => {
      const score = entry.stats?.score;
      const scoreText =
        typeof score === "number"
          ? `Fitness ${score}/${entry.stats?.scoreMaxPoints ?? 100}`
          : "no cached stats";
      return `- \`${entry.name}\` (${entry.category}) — ${scoreText}`;
    });
    sections.push(
      `### Dependencies (${input.dependencies.length})\n${lines.join("\n")}`,
    );
  }

  const mentioned = mentionedPackages(input.prompt, input.dependencies);
  if (mentioned.length > 0) {
    const blocks = mentioned.map(formatPackageBlock);
    sections.push(`### Mentioned packages\n\n${blocks.join("\n\n")}`);
  }

  return sections.join("\n\n");
}

/**
 * Returns the dep entries whose name (or unscoped suffix for scoped
 * names like @types/node) appears as a token in the user's prompt.
 * Uses an exact-token match on the lowercased prompt so casual
 * mentions ("how is lodash") match without false positives from
 * common English words. Results are deduped and capped at 8 to keep
 * the context block small even if the user lists many names.
 */
function mentionedPackages(
  prompt: string,
  dependencies: ContextDependency[],
): ContextDependency[] {
  const tokens = new Set(extractCandidatePackageNames(prompt));
  const matches: ContextDependency[] = [];
  for (const dep of dependencies) {
    const name = dep.name.toLowerCase();
    const unscoped = name.includes("/") ? name.split("/")[1] : name;
    if (tokens.has(name) || (unscoped && tokens.has(unscoped))) {
      matches.push(dep);
      if (matches.length >= 8) {
        break;
      }
    }
  }
  return matches;
}

/**
 * Formats a single package's PackageStats into a compact markdown
 * block for the model. Skipped fields (no cached stats, no GitHub
 * repo, etc.) are omitted entirely so the model isn't fed misleading
 * "null" placeholders. License compatibility verdicts are spelled
 * out so the model doesn't have to interpret booleans.
 */
function formatPackageBlock(entry: ContextDependency): string {
  const lines: string[] = [`#### \`${entry.name}\` (${entry.category})`];
  const stats = entry.stats;
  if (!stats) {
    lines.push("_No cached stats available._");
    return lines.join("\n");
  }
  if (typeof stats.score === "number") {
    lines.push(`- Fitness: ${stats.score}/${stats.scoreMaxPoints ?? 100}`);
  }
  if (stats.latestVersion) {
    lines.push(`- Latest version: ${stats.latestVersion}`);
  }
  if (stats.license) {
    const compat = stats.licenseCompatibility;
    const verdict = compat
      ? compat.isCompatible
        ? " (compatible with target license)"
        : " (incompatible with target license)"
      : "";
    lines.push(`- License: ${stats.license}${verdict}`);
  }
  if (stats.bundle) {
    lines.push(
      `- Bundle: ${stats.bundle.size} bytes (gzip ${stats.bundle.gzip})`,
    );
  }
  if (stats.securityAdvisories) {
    const { critical, high, moderate, low } = stats.securityAdvisories;
    const total = critical + high + moderate + low;
    if (total > 0) {
      lines.push(
        `- Security advisories: ${critical} critical, ${high} high, ${moderate} moderate, ${low} low`,
      );
    } else {
      lines.push(`- Security advisories: none known`);
    }
  }
  if (typeof stats.stars === "number") {
    lines.push(`- GitHub stars: ${stats.stars}`);
  }
  if (stats.lastCommitDate) {
    lines.push(`- Last commit: ${stats.lastCommitDate}`);
  }
  const recommendations = stats.recommendations;
  const replacementParts: string[] = [];
  for (const key of [
    "nativeReplacements",
    "preferredReplacements",
    "microUtilityReplacements",
  ] as const) {
    const list = recommendations?.[key];
    if (Array.isArray(list) && list.length > 0) {
      replacementParts.push(`${key}: ${list.length}`);
    }
  }
  if (replacementParts.length > 0) {
    lines.push(`- Recommendations available: ${replacementParts.join(", ")}`);
  }
  if (stats.githubUrl) {
    lines.push(`- GitHub: ${stats.githubUrl}`);
  }
  return lines.join("\n");
}
