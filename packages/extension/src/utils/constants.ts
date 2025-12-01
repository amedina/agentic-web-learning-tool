export const CONNECTION_NAMES = {
  CONTENT_SCRIPT: 'mcp-content-script-proxy',
  MCP_HOST: 'mcp',
} as const;

export const MESSAGE_TYPES = {
  REGISTER: 'register-tools',
  UPDATE: 'tools-updated',
  RESULT: 'tool-result',
  REFRESH_REQUEST: 'request-tools-refresh',
  EXECUTE: 'execute-tool',
} as const;