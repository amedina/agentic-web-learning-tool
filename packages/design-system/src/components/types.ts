export interface WebMCPTool {
  id?: string;
  name: string;
  namespace: string;
  description: string;
  allowedDomains: string[];
  inputSchema: Record<string, any>;
  code?: string;
  enabled: boolean;
  isBuiltIn?: boolean;
  isExtension?: boolean;
  isWorkflow?: boolean;
  editedScript?: {
    code: string | null;
    tabId: number[];
  };
}
