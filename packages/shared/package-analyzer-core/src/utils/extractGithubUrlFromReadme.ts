/**
 * Owner segments that appear after `github.com/` but don't identify a real
 * repository. Skipped so a README's "Sponsor on GitHub" link, organisation
 * homepage, or marketplace badge isn't mistaken for the package's source.
 */
const NON_REPO_OWNERS = new Set([
  "sponsors",
  "orgs",
  "organizations",
  "marketplace",
  "topics",
  "features",
  "search",
  "notifications",
  "pulls",
  "issues",
  "apps",
  "settings",
  "enterprise",
  "pricing",
  "customer-stories",
  "readme",
  "site",
  "about",
  "security",
  "explore",
  "trending",
  "collections",
  "events",
  "stars",
  "watching",
]);

/**
 * Scans a string for the first plausible `github.com/<owner>/<repo>` URL and
 * returns it normalised to `https://github.com/<owner>/<repo>`. Accepts both
 * bare URL fields (some package.json files publish `readme` as a URL pointing
 * to the canonical README on GitHub) and full markdown content. Returns null
 * when nothing repo-shaped is found.
 */
export function extractGithubUrlFromReadme(readme: unknown): string | null {
  if (typeof readme !== "string" || !readme) {
    return null;
  }

  // Walk the entire string but stop each capture at the first whitespace,
  // closing bracket/paren/quote, or trailing punctuation. Without commas /
  // semicolons in the terminator set, a sentence like "see foo, more here"
  // would pull the comma into the captured repo name.
  const pattern =
    /https?:\/\/github\.com\/([^\s\/)>\]"',;]+)\/([^\s\/)>\]"',;!#?]+)/gi;

  let match;
  while ((match = pattern.exec(readme)) !== null) {
    const owner = match[1];
    const repo = match[2].replace(/\.git$/i, "");

    if (NON_REPO_OWNERS.has(owner.toLowerCase())) {
      continue;
    }
    if (!owner || !repo) {
      continue;
    }

    return `https://github.com/${owner}/${repo}`;
  }

  return null;
}
