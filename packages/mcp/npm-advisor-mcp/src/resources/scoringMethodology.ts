/**
 * External dependencies.
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * URI clients use to fetch the scoring-methodology resource.
 */
export const SCORING_METHODOLOGY_URI = "npm-advisor://scoring-methodology";

/**
 * Markdown explaining exactly how `getPackageStats.score` is derived,
 * so any MCP client can quote the methodology back to its user without
 * making a tool call. Mirrors the in-code comments in
 * `package-analyzer-core/src/lib/getPackageStats.ts`; keep this in
 * sync with the scoring axes if those change.
 */
const SCORING_METHODOLOGY_MARKDOWN = `# npm-advisor scoring methodology

Every package returned by \`get_package_stats\` carries a numeric
\`score\` between 0 and \`scoreMaxPoints\`. The score is a weighted sum
across three positive axes plus one penalty axis. The denominator
(\`scoreMaxPoints\`) only includes axes that were actually evaluated —
data we couldn't fetch is marked \`unavailable\` and excluded from both
numerator and denominator so a package isn't punished for a missing
data source.

## Axes

| Axis | Max points | What it rewards |
| --- | --- | --- |
| **Bundle size** | 45 | Small gzipped payload at run time. Under 10 KB → full 45, under 50 KB → 15, otherwise 0. Skipped for \`devDependencies\` because dev tools don't ship to end users. |
| **Dependencies** | 35 | Few direct dependencies. Zero → full 35, 1–4 → 15, otherwise 0. A proxy for supply-chain surface area. |
| **Responsiveness** | 20 | High closed-issues ratio on the linked GitHub repo. Scaled linearly: ratio 1.0 → 20 points, 0.5 → 10, etc. Marked unavailable when the package has no public GitHub repo. |
| **Security penalty** | -15 (capped) | One penalty point per low-severity advisory, two per moderate, three per high, five per critical. Capped at -15 so a heavily-advised package can't dominate the score. Filtered to advisories that affect the resolved version when one was passed (lockfile mode). |

## Status field

Each axis in \`scoreBreakdown[]\` carries a \`status\`:

- \`scored\`: axis evaluated; both points and maxPoints contribute.
- \`unavailable\`: required data was missing (e.g. bundlephobia
  returned no result, no GitHub repo to inspect). Contributes nothing
  to either side of the fraction.
- \`penalty\`: only deducts points; \`maxPoints\` is 0 so the
  denominator is unaffected.

## Version resolution

\`versionResolution\` on the result tells you which version the score
reflects:

- \`"lockfile"\`: the caller passed \`resolvedVersion\` (typically
  derived from \`package-lock.json\` / \`pnpm-lock.yaml\` /
  \`yarn.lock\`). Advisory matching and bundle / metadata lookups all
  target that exact version.
- \`"latest-fallback"\`: no installed version was known, so the score
  reflects the latest published version. The user might be on an
  older release; surface this caveat when presenting results.

## What's intentionally not in the score

The e18e replacement-availability signal is shown via the
\`recommendations\` field but never moves the score. Whether a
modern replacement exists is a property of the surrounding
ecosystem, not the package itself — conflating the two would
penalise battle-tested packages for not yet being deprecated.
`;

/**
 * Register the scoring-methodology resource on a fresh {@link McpServer}.
 * Called once per session by the server factory in `server.ts`.
 */
export function registerScoringMethodologyResource(server: McpServer): void {
  server.registerResource(
    "scoring-methodology",
    SCORING_METHODOLOGY_URI,
    {
      title: "npm-advisor scoring methodology",
      description:
        "Markdown documentation of how the Fitness score (returned by every get_package_stats call) is computed: which axes contribute, their weights, when an axis is marked unavailable, and how version-resolution affects the verdict.",
      mimeType: "text/markdown",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.toString(),
          mimeType: "text/markdown",
          text: SCORING_METHODOLOGY_MARKDOWN,
        },
      ],
    }),
  );
}
