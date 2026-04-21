/**
 * Formats input data for executors that expect a single string.
 * If input is an array, it joins elements with newlines.
 * If input is null/undefined, it returns an empty string.
 */
export function formatInputText(input: unknown): string {
  if (Array.isArray(input)) {
    return input.map(String).join('\n');
  }

  if (input === null || input === undefined) {
    return '';
  }

  return String(input);
}
