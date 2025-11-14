/**
 * Hash function to create consistent, shorter identifiers for tool names
 * that exceed the 64 character limit.
 * @param name The tool name to hash
 * @returns A hashed version of the name if it's >= 64 chars, otherwise the original name
 */
export function getToolNameForUI(name: string): string {
  if (name.length < 64) {
    return name;
  }

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return `tool_${Math.abs(hash).toString(36)}`;
}
