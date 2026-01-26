export interface MCPServerConfig {
  transport: 'http' | 'sse';
  url: string;
  authToken?: string;
  enabled: boolean;
  name: string;
}
export interface MCPConfig {
  mcpServers: Record<string, MCPServerConfig>;
}
