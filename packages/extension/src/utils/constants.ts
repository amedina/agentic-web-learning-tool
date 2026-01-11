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

export const LOG_OPTS = [
  {
    id: 'DEBUG',
    label: 'Debug',
    color: 'bg-status-debug',
    desc: 'Detailed ops',
  },
  {
    id: 'WARN',
    label: 'Warn',
    color: 'bg-status-warn',
    desc: 'Handled issues',
  },
  { id: 'ERROR', label: 'Error', color: 'bg-status-error', desc: 'Failures' },
  {
    id: 'SILENT',
    label: 'Silent',
    color: 'bg-status-silent',
    desc: 'No logs',
  },
] as const;
