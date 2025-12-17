/**
 * Sanitizes a string to be safe for use in MCP tool names.
 */
function sanitizeToolName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_]/g, '_');
}

export default sanitizeToolName;