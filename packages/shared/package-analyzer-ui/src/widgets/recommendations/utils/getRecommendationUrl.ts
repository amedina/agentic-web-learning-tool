/**
 * Get Recommendation Url.
 */
export function getRecommendationUrl(r: any): string | null {
  if (r.replacementModule) {
    return `https://www.npmjs.com/package/${r.replacementModule}`;
  }
  if (r.url) {
    switch (r.url.type) {
      case "mdn":
        return `https://developer.mozilla.org/en-US/docs/${r.url.id}`;
      case "github":
        return `https://github.com/${r.url.id}`;
      case "npm":
        return `https://www.npmjs.com/package/${r.url.id}`;
      case "e18e":
        return `https://e18e.dev`;
      default:
        return null;
    }
  }
  return null;
}
