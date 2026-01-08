
/**
 * Internal Dependencies.
 */
import isDomainAllowed from '../domainMatcher';

describe('isDomainAllowed', () => {
  // Test Case 1: Basic Validation
  describe('Basic Validation', () => {
    it('should return false if allowedDomains is undefined', () => {
      expect(isDomainAllowed('https://google.com', undefined)).toBe(false);
    });

    it('should return false if allowedDomains is empty', () => {
      expect(isDomainAllowed('https://google.com', [])).toBe(false);
    });

    it('should return false for invalid URLs checks implicitly by not crashing (returns false on error)', () => {
       expect(isDomainAllowed('invalid-url', ['google.com'])).toBe(false);
    });
  });

  // Test Case 2: Universal Access
  describe('Universal Access', () => {
    it('should return true if <all_urls> is present', () => {
      expect(isDomainAllowed('https://any-domain.com/page', ['google.com', '<all_urls>'])).toBe(true);
    });
  });

  describe('Single Page Access', () => {
    it('should return true if a single page is allowed', () => {
      expect(isDomainAllowed('https://www.allrecipes.com/recipe/68813/spicy-basil-chicken/', ['allrecipes.com'])).toBe(true);
    });
  });

  // Test Case 3: Exact & Subdomain Matching
  describe('Exact & Subdomain Matching', () => {
    const allowed = ['google.com', 'example.org'];

    it('should match exact domain', () => {
      expect(isDomainAllowed('https://google.com', allowed)).toBe(true);
      expect(isDomainAllowed('http://example.org', allowed)).toBe(true);
    });

    it('should match subdomains implicitly for simple domains', () => {
      expect(isDomainAllowed('https://mail.google.com', allowed)).toBe(true);
      expect(isDomainAllowed('https://sub.example.org', allowed)).toBe(true);
    });

    it('should not match partial domain suffix that is different domain', () => {
      // e.g. "agoogle.com" should not match "google.com"
      // current implementation: hostname.endsWith('.' + suffix) || hostname === suffix
      // so "agoogle.com" !== "google.com" and "agoogle.com" does not end with ".google.com"
      expect(isDomainAllowed('https://agoogle.com', allowed)).toBe(false);
    });

    it('should not match unrelated domains', () => {
      expect(isDomainAllowed('https://yahoo.com', allowed)).toBe(false);
    });
  });

  // Test Case 4: Wildcard Matching
  describe('Wildcard Matching', () => {
    it('should handle *.domain.com explicit wildcards', () => {
      const allowed = ['*.wikipedia.org'];
      expect(isDomainAllowed('https://en.wikipedia.org', allowed)).toBe(true);
      expect(isDomainAllowed('https://wikipedia.org', allowed)).toBe(true); // Implementation detail: treats *. as suffix check
    });
    
    // Note: The implementation: 
    // const suffix = pattern.startsWith('*.') ? pattern.slice(2) : pattern;
    // return hostname === suffix || hostname.endsWith('.' + suffix);
    // So *.wikipedia.org becomes wikipedia.org checking.
  });

  // Test Case 5: Full URL Patterns
  describe('Full URL Patterns', () => {
    it('should match exact full URL pattern', () => {
      const allowed = ['https://github.com/microsoft/vscode'];
      expect(isDomainAllowed('https://github.com/microsoft/vscode', allowed)).toBe(true);
    });

    it('should match pattern with implicit regex wildcards (glob-like)', () => {
      // pattern with / triggers regex path
      // logic: pattern.replace(/\*/g, '.*')
      const allowed = ['https://github.com/*/vscode']; 
      expect(isDomainAllowed('https://github.com/microsoft/vscode', allowed)).toBe(true);
      expect(isDomainAllowed('https://github.com/other/vscode', allowed)).toBe(true);
      expect(isDomainAllowed('https://github.com/microsoft/other', allowed)).toBe(false);
    });

    it('should handle trailing slashes in pattern vs url', () => {
       // Case A: Pattern has slash, URL matches exact
       const allowedWithSlash = ['https://example.com/api/'];
       expect(isDomainAllowed('https://example.com/api/', allowedWithSlash)).toBe(true);
       // Current implementation implies: if pattern HAS slash, URL MUST have it (or at least match the regex).
       // So '.../api' expects false if pattern is '.../api/'
       expect(isDomainAllowed('https://example.com/api', allowedWithSlash)).toBe(false); 

       // Case B: Pattern has NO slash, URL can have it or not
       const allowedNoSlash = ['https://example.com/api'];
       expect(isDomainAllowed('https://example.com/api', allowedNoSlash)).toBe(true);
       expect(isDomainAllowed('https://example.com/api/', allowedNoSlash)).toBe(true);
    });
  });
});
