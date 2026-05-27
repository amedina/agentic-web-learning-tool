/**
 * External dependencies.
 */
import { fetchModuleReplacements } from "@agentic-web-labs/package-analyzer-core";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * URI clients use to fetch the recommended-replacements resource.
 */
export const RECOMMENDED_REPLACEMENTS_URI =
  "npm-advisor://recommended-replacements";

interface ReplacementManifestEntry {
  mappings?: Record<string, { replacements?: string[] }>;
  replacements?: Record<string, { id?: string; name?: string }>;
}

interface ReplacementSummary {
  fromPackage: string;
  to: Array<{ id: string; name?: string; manifest: string }>;
}

/**
 * Build a flat list of `from → to` replacement suggestions across all
 * three e18e manifests so a client can pre-load every known
 * recommendation without firing per-package tool calls. Network is
 * tolerated to fail (any of the three may 404 or rate-limit on
 * github.com); we simply skip that manifest's entries.
 */
async function buildReplacementSummary(): Promise<ReplacementSummary[]> {
  const manifestTypes = ["native", "micro-utilities", "preferred"] as const;
  const settled = await Promise.allSettled(
    manifestTypes.map((type) => fetchModuleReplacements(type)),
  );

  const summary = new Map<string, ReplacementSummary>();
  for (let index = 0; index < manifestTypes.length; index += 1) {
    const result = settled[index];
    if (result.status !== "fulfilled" || !result.value) {
      continue;
    }
    const manifest = result.value as ReplacementManifestEntry;
    const mappings = manifest.mappings ?? {};
    const replacements = manifest.replacements ?? {};
    for (const [from, mapping] of Object.entries(mappings)) {
      const ids = mapping?.replacements ?? [];
      const targets = ids
        .map((id) => {
          const entry = replacements[id];
          if (!entry) {
            return null;
          }
          return {
            id,
            name: entry.name,
            manifest: manifestTypes[index],
          };
        })
        .filter(
          (entry): entry is ReplacementSummary["to"][number] => entry !== null,
        );
      if (targets.length === 0) {
        continue;
      }
      const existing = summary.get(from) ?? { fromPackage: from, to: [] };
      existing.to.push(...targets);
      summary.set(from, existing);
    }
  }
  return [...summary.values()].sort((a, b) =>
    a.fromPackage.localeCompare(b.fromPackage),
  );
}

/**
 * Register the recommended-replacements resource. Built on top of the
 * existing e18e manifest fetcher so the data stays in lock-step with
 * what `get_package_stats.recommendations` shows; the resource just
 * returns the full table at once instead of per-package slices.
 */
export function registerRecommendedReplacementsResource(
  server: McpServer,
): void {
  server.registerResource(
    "recommended-replacements",
    RECOMMENDED_REPLACEMENTS_URI,
    {
      title: "Recommended npm replacements",
      description:
        "Flat list of `from → to` replacement suggestions aggregated from the e18e module-replacements manifests (native, micro-utilities, preferred). Useful when an agent wants to scan a project for modernisation opportunities without firing one tool call per dependency.",
      mimeType: "application/json",
    },
    async (uri) => {
      const summary = await buildReplacementSummary();
      return {
        contents: [
          {
            uri: uri.toString(),
            mimeType: "application/json",
            text: JSON.stringify(
              {
                source:
                  "https://github.com/es-tooling/module-replacements/tree/main/manifests",
                count: summary.length,
                replacements: summary,
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );
}
