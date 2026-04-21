/**
 * Sanitizes a tool name by replacing every character that is not an ASCII
 * letter (A–Z, a–z), digit (0–9), or underscore (_) with an underscore.
 *
 * Preserves existing ASCII letters, digits, and underscores. Any other
 * characters — including whitespace, punctuation, and non-ASCII characters
 * (e.g. accented letters or CJK characters) — are replaced with `_`.
 * Consecutive invalid characters are each replaced by an underscore (no collapsing).
 *
 * @param name - The input tool name to sanitize.
 * @returns The sanitized tool name containing only ASCII letters, digits, and underscores.
 *
 * @example
 * sanitizeToolName('My Tool! v2') // -> 'My_Tool__v2'
 *
 * @remarks
 * This function uses the regular expression `/[^a-zA-Z0-9_]/g`, so only the
 * characters in the ASCII alphanumeric range and underscore are considered valid.
 * The function is pure and has no side effects.
 */
function sanitizeToolName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_]/g, '_');
}

export default sanitizeToolName;
