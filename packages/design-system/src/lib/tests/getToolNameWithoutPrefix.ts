/**
 * Internal dependencies
 */
import getToolNameWithoutPrefix from '../getToolNameWithoutPrefix';

describe('getToolNameWithoutPrefix', () => {
  // 1. Happy Paths: Website Tools
  describe('when handling "website_tool_" prefix', () => {
    it('extracts a simple tool name correctly', () => {
      const input = 'website_tool_example.com_tab123_weather';
      const result = getToolNameWithoutPrefix(input);
      expect(result).toBe('weather');
    });

    it('extracts a tool name containing underscores', () => {
      const input = 'website_tool_google.com_tab99_search_images_advanced';
      const result = getToolNameWithoutPrefix(input);
      expect(result).toBe('search_images_advanced');
    });

    it('handles alphanumeric tab identifiers', () => {
      const input = 'website_tool_site.org_tab3a4b_login';
      const result = getToolNameWithoutPrefix(input);
      expect(result).toBe('login');
    });
  });

  // 2. Happy Paths: Extension Tools
  describe('when handling "extension_tool_" prefix', () => {
    it('extracts the tool name correctly', () => {
      const input = 'extension_tool_browser_tab0_screenshot';
      const result = getToolNameWithoutPrefix(input);
      expect(result).toBe('screenshot');
    });

    it('extracts complex tool names from extension tools', () => {
      const input = 'extension_tool_local_tab1_generate_pdf_report';
      const result = getToolNameWithoutPrefix(input);
      expect(result).toBe('generate_pdf_report');
    });
  });

  // 3. Passthrough (No Prefix)
  describe('when no known prefix is present', () => {
    it('returns the original string as-is', () => {
      const input = 'some_random_tool_name';
      const result = getToolNameWithoutPrefix(input);
      expect(result).toBe(input);
    });

    it('returns empty string as-is', () => {
      const input = '';
      const result = getToolNameWithoutPrefix(input);
      expect(result).toBe('');
    });
  });

  // 4. Edge Cases / Malformed Inputs
  describe('edge cases', () => {
    it('returns undefined if prefix exists but "tab" pattern is missing', () => {
      // The regex `/_tab[^_]+_(.+)$/` expects a specific structure.
      // If that structure isn't found after the prefix, it returns undefined.
      const input = 'website_tool_malformed_string_without_the_t-word';
      const result = getToolNameWithoutPrefix(input);
      expect(result).toBeUndefined();
    });

    it('returns undefined if prefix exists but there is no tool name after the tab ID', () => {
      // Regex expects `(.+)` (at least one char) after the tab ID underscore
      const input = 'website_tool_example.com_tab123_';
      const result = getToolNameWithoutPrefix(input);
      expect(result).toBeUndefined();
    });
  });
});
