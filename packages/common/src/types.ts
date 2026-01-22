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

export type AdsAndBiddersType = any;
export type CookieTableData = any;
export type InterestGroups = any;
export type NoBidsType = any;
export type singleAuctionEvent = any;
export type ErroredOutUrlsData = any;
export type SourcesData = any;
export type Context<T> = T | any;
