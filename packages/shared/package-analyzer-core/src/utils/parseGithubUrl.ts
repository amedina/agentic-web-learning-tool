/**
 * Parse Github Url.
 */
export function parseGithubUrl(
  url: string,
): { owner: string; repo: string } | null {
  if (!url) return null;
  try {
    // Normalise the repository.url shapes npm allows into something `URL` can
    // parse: git+https://github.com/axios/axios.git, git://github.com/...,
    // git+ssh://git@github.com/owner/repo.git, and the SCP-style SSH shorthand
    // git@github.com:owner/repo.git (no scheme, colon before the path), which
    // `new URL()` rejects outright.
    let cleanUrl = url
      .replace(/^git\+/, "")
      .replace(/^git:\/\//, "https://")
      .replace(/^git@([^/:]+):/, "https://$1/");
    const parsed = new URL(cleanUrl);
    if (parsed.hostname === "github.com") {
      const pathParts = parsed.pathname.split("/").filter((p) => p && p !== "");
      if (pathParts.length >= 2) {
        let repo = pathParts[1];
        if (repo.endsWith(".git")) {
          repo = repo.slice(0, -4);
        }
        return { owner: pathParts[0], repo };
      }
    }
  } catch (e) {
    // A repository.url we still can't parse is benign — the package just
    // loses its GitHub-derived data — so warn rather than error.
    console.warn("Failed to parse Github URL", url, e);
  }
  return null;
}
