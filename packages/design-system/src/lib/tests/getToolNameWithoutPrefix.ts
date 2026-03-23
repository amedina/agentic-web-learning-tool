/**
 * Internal dependencies
 */
import getToolNameWithoutPrefix from '../getToolNameWithoutPrefix';

describe('getToolNameWithoutPrefix', () => {
  // 2. Happy Paths: Extension Tools
  describe('when handling "extension_tool_" prefix', () => {
    it('extracts the tool name correctly', () => {
      const input = 'extension_tool_browser_screenshot';
      const result = getToolNameWithoutPrefix(input);
      expect(result).toBe('browser_screenshot');
    });

    it('extracts complex tool names from extension tools', () => {
      const input = 'extension_tool_generate_pdf_report';
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
});
