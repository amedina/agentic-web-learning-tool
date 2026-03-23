/**
 * Potential Issues — Runtime verification tests for domain matcher ReDoS.
 *
 * These tests confirm or deny issue 8.3 from docs/potential-issues.md.
 */
import isDomainAllowed from '../domainMatcher';

// ─── 8.3 — Domain pattern with catastrophic backtracking (ReDoS) ─────────────

describe('Issue 8.3: Domain matcher ReDoS vulnerability', () => {
  it('user-supplied pattern is converted to regex without validation', () => {
    // Any string with / goes through new RegExp() — no input validation
    const patterns = ['https://evil.com/path'];
    expect(typeof isDomainAllowed('https://evil.com/path', patterns)).toBe(
      'boolean'
    );
  });

  it('multiple wildcards create nested .* in regex', () => {
    // Pattern with multiple * chars creates .*.*  which can cause backtracking
    const pattern = 'https://*/*/*/*/*';
    const url = 'https://a/b/c/d/e/f';

    // Should still return a result (not hang) for this size
    const result = isDomainAllowed(url, [pattern]);
    expect(typeof result).toBe('boolean');
  });

  it('pattern with special regex chars are escaped except *', () => {
    // The domainMatcher escapes .+?^${}()|[]\\ but NOT *
    // * becomes .* — this is intentional but creates ReDoS risk
    const pattern = 'https://example.com/path.with.dots/*/page';
    expect(
      isDomainAllowed('https://example.com/path.with.dots/anything/page', [
        pattern,
      ])
    ).toBe(true);
    expect(
      isDomainAllowed('https://example.com/pathXwithXdots/anything/page', [
        pattern,
      ])
    ).toBe(false);
  });

  it('query string in URL prevents pattern match (issue 8.4)', () => {
    // Pattern matches against urlObj.href which includes query strings
    const pattern = 'https://example.com/path';
    // URL with query string
    expect(
      isDomainAllowed('https://example.com/path?id=1', [pattern])
    ).toBe(false);
    // URL without query string matches
    expect(isDomainAllowed('https://example.com/path', [pattern])).toBe(true);
  });
});
