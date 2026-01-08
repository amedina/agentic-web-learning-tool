export interface WebMCPTool {
  name: string;
  namespace: string;
  description: string;
  allowedDomains: string[];
  inputSchema: Record<string, any>;
  code?: string;
  enabled: boolean;
  isBuiltIn?: boolean;
}
