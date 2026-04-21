/**
 * Internal dependencies
 */
import {
  cn,
  splitLines,
  joinLines,
  isEmptyOrWhitespace,
  isComment,
} from '../utils';

describe('utils', () => {
  describe('cn', () => {
    it('merges class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
      expect(cn('class1', { class2: true, class3: false })).toBe(
        'class1 class2'
      );
    });

    it('merges tailwind classes using tailwind-merge', () => {
      expect(cn('p-4', 'p-8')).toBe('p-8');
      expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
    });
  });

  describe('splitLines', () => {
    it('splits code by newline', () => {
      expect(splitLines('line1\nline2\nline3')).toEqual([
        'line1',
        'line2',
        'line3',
      ]);
    });

    it('splits code by carriage return and newline', () => {
      expect(splitLines('line1\r\nline2\r\nline3')).toEqual([
        'line1',
        'line2',
        'line3',
      ]);
    });

    it('returns single line as array', () => {
      expect(splitLines('line1')).toEqual(['line1']);
      expect(splitLines('')).toEqual(['']);
    });
  });

  describe('joinLines', () => {
    it('joins array of lines with newline', () => {
      expect(joinLines(['line1', 'line2', 'line3'])).toBe(
        'line1\nline2\nline3'
      );
    });

    it('handles single line array', () => {
      expect(joinLines(['line1'])).toBe('line1');
    });

    it('handles empty array', () => {
      expect(joinLines([])).toBe('');
    });
  });

  describe('isEmptyOrWhitespace', () => {
    it('returns true for empty string', () => {
      expect(isEmptyOrWhitespace('')).toBe(true);
    });

    it('returns true for whitespace string', () => {
      expect(isEmptyOrWhitespace('   ')).toBe(true);
      expect(isEmptyOrWhitespace(' \t \n ')).toBe(true);
    });

    it('returns false for non-empty string', () => {
      expect(isEmptyOrWhitespace('text')).toBe(false);
      expect(isEmptyOrWhitespace(' text ')).toBe(false);
    });
  });

  describe('isComment', () => {
    it('returns true for single-line comment', () => {
      expect(isComment('// comment')).toBe(true);
      expect(isComment('  // padded comment')).toBe(true);
    });

    it('returns true for multi-line comment start', () => {
      expect(isComment('/* comment */')).toBe(true);
      expect(isComment('  /* padded comment */')).toBe(true);
      expect(isComment('/** jsdoc */')).toBe(true);
    });

    it('returns false for regular code', () => {
      expect(isComment('const x = 1;')).toBe(false);
      expect(isComment('')).toBe(false);
      expect(isComment('   ')).toBe(false);
    });

    it('returns false for code containing comment inside but not starting with it', () => {
      expect(isComment('const x = 1; // comment')).toBe(false);
    });
  });
});
