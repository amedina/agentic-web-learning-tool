/**
 * Checks if a given URL matches any of the allowed domain patterns.
 * Supports:
 * - <all_urls>
 * - Exact hostname match (e.g. "google.com")
 * - Wildcards (e.g. "*.google.com")
 *
 * @param url The current URL to check
 * @param allowedDomains List of allowed domain patterns
 */
function isDomainAllowed(url: string, allowedDomains?: string[]): boolean {
  if (!allowedDomains || allowedDomains.length === 0) {
    return false;
  }

  if (allowedDomains.includes('<all_urls>')) {
    return true;
  }

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    // Remove trailing slash for consistency if needed, but keeping standard href is usually safer for exact matches
    const fullUrl = urlObj.href;

    return allowedDomains.some((pattern) => {
      // 0. <all_urls> handled above

      // 1. Handle full URL patterns (contain '/' or '://')
      if (pattern.includes('/') || pattern.includes('://')) {
        // Simple wildcard conversion to regex
        // Escape special regex chars except *
        const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
        // Convert * to .*
        const regexStr = '^' + escaped.replace(/\*/g, '.*') + '$';
        const regex = new RegExp(regexStr);
        return regex.test(fullUrl) || regex.test(fullUrl.replace(/\/$/, '')); // Match with or without trailing slash
      }

      // 2. Exact hostname match or subdomain match
      // Treat simple domains (e.g. "google.com") as implicitly allowing subdomains
      // Also handles explicit wildcards (e.g. "*.google.com")
      const suffix = pattern.startsWith('*.') ? pattern.slice(2) : pattern;
      return hostname === suffix || hostname.endsWith('.' + suffix);
    });
  } catch {
    return false;
  }
}

export default isDomainAllowed;
