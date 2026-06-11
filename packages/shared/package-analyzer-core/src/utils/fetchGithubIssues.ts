/**
 * Internal dependencies.
 */
import { githubFetch, GithubValidationError } from "./githubFetch";
import { fetchGithubRepo } from "./fetchGithubRepo";

/**
 * Run the two issue-activity Search queries for a given owner/repo: a sample
 * of recent issues/PRs (for the responsiveness ratio) and the true total open
 * issue count.
 *
 * Using the Search API has a 10req/min (600/hr) unauthenticated rate limit,
 * dodging the basic 60/hr Core API limit. GitHub Search requires field
 * qualifiers like `repo:` to keep their colons/slashes unencoded; only the
 * space separators need encoding (%20). `encodeURIComponent` would turn `:`
 * and `/` into %3A and %2F, breaking the qualifier syntax and returning 0
 * results.
 */
async function searchIssueActivity(
  owner: string,
  repo: string,
  signal?: AbortSignal,
) {
  const sampleUrl = `https://api.github.com/search/issues?q=repo:${owner}/${repo}%20is:issue&per_page=100`;
  const openCountUrl = `https://api.github.com/search/issues?q=repo:${owner}/${repo}%20is:issue%20is:open&per_page=1`;

  const [sampleData, openCountData] = (await Promise.all([
    githubFetch(sampleUrl, signal),
    githubFetch(openCountUrl, signal),
  ])) as [any, any];

  return {
    items: sampleData?.items ?? (Array.isArray(sampleData) ? sampleData : []),
    openTotalCount:
      typeof openCountData?.total_count === "number"
        ? openCountData.total_count
        : null,
  };
}

/**
 * Read the canonical slug from the ungh mirror, which follows GitHub transfers
 * and reports the current `owner/repo` in `repo.repo`. Quota-friendly and
 * usually cache-warm (the repo fetch runs in parallel). Returns `null` when
 * ungh is unreachable or doesn't report a slug.
 */
async function canonicalSlugFromUngh(
  owner: string,
  repo: string,
  signal?: AbortSignal,
): Promise<string | null> {
  const data = (await fetchGithubRepo(owner, repo, signal).catch(
    () => null,
  )) as any;
  const slug: unknown = data?.repo?.repo;
  return typeof slug === "string" ? slug : null;
}

/**
 * Read the canonical slug from GitHub's REST repos endpoint, which also
 * follows transfers and reports the current slug in `full_name`. Used as a
 * fallback when ungh can't resolve it, so a transferred repo still recovers
 * even if the mirror is down. Returns `null` on any failure.
 */
async function canonicalSlugFromRest(
  owner: string,
  repo: string,
  signal?: AbortSignal,
): Promise<string | null> {
  const data = (await githubFetch(
    `https://api.github.com/repos/${owner}/${repo}`,
    signal,
  ).catch(() => null)) as any;
  const fullName: unknown = data?.full_name;
  return typeof fullName === "string" ? fullName : null;
}

/**
 * Resolve the canonical `owner/repo` for a possibly transferred or renamed
 * repository. Tries the ungh mirror first (quota-friendly, usually cache-warm)
 * and falls back to GitHub REST so a transfer still recovers when ungh is
 * unavailable. Returns `null` when neither source yields a usable slug.
 */
async function resolveCanonicalRepo(
  owner: string,
  repo: string,
  signal?: AbortSignal,
): Promise<{ owner: string; repo: string } | null> {
  const slug =
    (await canonicalSlugFromUngh(owner, repo, signal)) ??
    (await canonicalSlugFromRest(owner, repo, signal));
  if (slug && slug.includes("/")) {
    const [canonicalOwner, canonicalRepo] = slug.split("/");
    if (canonicalOwner && canonicalRepo) {
      return { owner: canonicalOwner, repo: canonicalRepo };
    }
  }
  return null;
}

/**
 * Fetch Github Issues.
 *
 * Returns both a sample of issues (for responsiveness ratio) and the true
 * total open issues count (via a separate search with `is:open`).
 *
 * GitHub's Search API validates the `repo:` qualifier literally and returns a
 * 422 when the slug no longer resolves. This happens when a repo was
 * transferred or renamed but npm's `repository.url` still points at the old
 * slug (e.g. `ladjs/superagent`, now `forwardemail/superagent`): the REST and
 * ungh endpoints follow the transfer, but Search does not. On that 422 we
 * resolve the canonical slug and retry once so the responsiveness data loads
 * instead of permanently showing "couldn't fetch".
 */
export async function fetchGithubIssues(
  owner: string,
  repo: string,
  signal?: AbortSignal,
) {
  try {
    return await searchIssueActivity(owner, repo, signal);
  } catch (error) {
    if (!(error instanceof GithubValidationError)) {
      throw error;
    }
    const canonical = await resolveCanonicalRepo(owner, repo, signal);
    if (!canonical || (canonical.owner === owner && canonical.repo === repo)) {
      throw error;
    }
    return await searchIssueActivity(canonical.owner, canonical.repo, signal);
  }
}
