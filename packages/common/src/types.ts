export interface MCPServerConfig {
  transport: 'http' | 'sse';
  url: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  authToken?: string;
  enabled: boolean;
  name: string;
}
export interface MCPConfig {
  mcpServers: Record<string, MCPServerConfig>;
}
