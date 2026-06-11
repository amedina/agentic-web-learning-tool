/**
 * External dependencies.
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * URI clients use to fetch the data-sources resource.
 */
export const DATA_SOURCES_URI = "npm-advisor://data-sources";

/**
 * Markdown listing every upstream API analyzer-core touches so a
 * caller can explain provenance to the user without making a tool
 * call. Keep this in sync with the imports under
 * `package-analyzer-core/src/utils/fetch*.ts` when adding sources.
 */
const DATA_SOURCES_MARKDOWN = `# npm-advisor data sources

The analyzer behind \`get_package_stats\` / \`analyze_package_json\`
aggregates from several upstreams. None require API keys for basic
use; setting \`GITHUB_TOKEN\` lifts GitHub from 60 req/hr to 5,000.

## Per-package metadata

- **npm registry** — \`https://registry.npmjs.org/{pkg}\`. Source of
  truth for description, license, repository, dist-tags, and the full
  versions table that lockfile-aware lookups index into.
- **bundlephobia** — \`https://bundlephobia.com/api/size\`. Used for
  the Bundle Size scoring axis. Returns gzipped + uncompressed
  bytes, tree-shake-ability, and side-effects metadata.

## Repository health

- **ungh.cc** (\`https://ungh.cc/repos/{owner}/{repo}\`) — anonymous
  GitHub mirror for stars + last commit date. Sidesteps the strict
  60 req/hr Core REST limit when the user isn't authenticated.
- **GitHub REST** (\`https://api.github.com/repos/...\`) — used for
  security advisories and (as a fallback during issue
  rate-limit detection) the repo's open-issues count.
- **GitHub Search** (\`https://api.github.com/search/issues\`) — sampled
  to derive the Responsiveness axis. 10 req/min unauthenticated.

## Security advisories

Both feeds are queried in parallel and deduplicated by canonical
GHSA / CVE id; OSV-only findings are added alongside GitHub records.

- **GitHub Security Advisories** — \`/repos/{owner}/{repo}/security-advisories\`.
- **OSV** — \`POST https://api.osv.dev/v1/query\` with
  \`{ package: { ecosystem: "npm", name }, version? }\`. OSV is the
  primary aggregator for npm advisories beyond GitHub's own feed.

## Replacement recommendations

- **e18e module-replacements manifest** —
  \`https://raw.githubusercontent.com/es-tooling/module-replacements/main/manifests/{native|micro-utilities|preferred}.json\`.
  Surfaces alternatives like "use \`fetch\` instead of \`axios\`" or
  "use \`Array.prototype.flat\` instead of \`lodash.flatten\`". Cached
  per session; refreshed when the manifest changes upstream.

## Caching and rate-limit handling

All upstream calls go through a bounded LRU+TTL cache (default 500
entries, 10 minute TTL) with single-flight semantics — concurrent
identical requests share one network round-trip. GitHub rate-limit
responses (403 + \`x-ratelimit-remaining: 0\`, or 429) raise a typed
\`GithubRateLimitError\` so the wrapping tool can surface a clear
"set GITHUB_TOKEN" message rather than a generic network failure.
`;

/**
 * Register the data-sources resource. One-shot during server build.
 */
export function registerDataSourcesResource(server: McpServer): void {
  server.registerResource(
    "data-sources",
    DATA_SOURCES_URI,
    {
      title: "npm-advisor data sources",
      description:
        "Markdown listing every upstream API analyzer-core consults (npm registry, bundlephobia, GitHub REST + Search + security advisories, OSV, e18e module-replacements) plus the cache and rate-limit policy that wraps them.",
      mimeType: "text/markdown",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.toString(),
          mimeType: "text/markdown",
          text: DATA_SOURCES_MARKDOWN,
        },
      ],
    }),
  );
}
