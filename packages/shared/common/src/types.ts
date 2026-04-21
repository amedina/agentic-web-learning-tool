export interface CustomHeader {
  name: string;
  value: string;
  enabled: boolean;
}

export type CustomHeaders = CustomHeader[];
export interface MCPServerConfig {
  transport: 'sse' | 'streamable-http' | 'stateless-http';
  url: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  authToken?: string;
  // OAuth fields
  oauthClientId?: string;
  oauthClientSecret?: string;
  oauthScope?: string;
  // Custom Headers
  connectionType?: 'direct' | 'proxy';
  customHeaders?: CustomHeaders;
  inspectorConfig?: InspectorConfig;
  enabled: boolean;
  name: string;
  isReconnecting?: boolean;
  oAuthToken?: string;
}
export interface MCPConfig {
  mcpServers: Record<string, MCPServerConfig>;
}

export type ConfigItem = {
  label: string;
  description: string;
  value: string | number | boolean;
  is_session_item: boolean;
};

export type InspectorConfig = {
  /**
   * Client-side timeout in milliseconds. The Inspector will cancel the request if no response
   * is received within this time. Note: This is independent of any server-side timeouts.
   */
  MCP_SERVER_REQUEST_TIMEOUT: ConfigItem;

  /**
   * Whether to reset the timeout on progress notifications. Useful for long-running operations that send periodic progress updates.
   * Refer: https://spec.modelcontextprotocol.io/specification/2025-03-26/basic/utilities/progress/#progress-flow
   */
  MCP_REQUEST_TIMEOUT_RESET_ON_PROGRESS: ConfigItem;

  /**
   * Maximum total time in milliseconds to wait for a response from the MCP server before timing out. Used in conjunction with MCP_SERVER_REQUEST_TIMEOUT_RESET_ON_PROGRESS.
   * Refer: https://spec.modelcontextprotocol.io/specification/2025-03-26/basic/utilities/progress/#progress-flow
   */
  MCP_REQUEST_MAX_TOTAL_TIMEOUT: ConfigItem;

  /**
   * The full address of the MCP Proxy Server, in case it is running on a non-default address. Example: http://10.1.1.22:5577
   */
  MCP_PROXY_FULL_ADDRESS: ConfigItem;

  /**
   * Session token for authenticating with the MCP Proxy Server. This token is displayed in the proxy server console on startup.
   */
  MCP_PROXY_AUTH_TOKEN: ConfigItem;
};
