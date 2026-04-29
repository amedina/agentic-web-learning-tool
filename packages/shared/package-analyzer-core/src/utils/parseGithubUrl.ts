/**
 * Parse Github Url.
 */
export function parseGithubUrl(
  url: string,
): { owner: string; repo: string } | null {
  if (!url) return null;
  try {
    // Handle formats like: git+https://github.com/axios/axios.git, https://github.com/axios/axios, git://github.com/...
    let cleanUrl = url.replace(/^git\+/, "").replace(/^git:\/\//, "https://");
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
    console.error("Failed to parse Github URL", url, e);
  }
  return null;
}
