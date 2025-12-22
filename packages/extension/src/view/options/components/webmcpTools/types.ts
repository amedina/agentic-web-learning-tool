export interface WebMCPTool {
    name: string;
    namespace: string;
    version: string;
    description: string;
    matchPatterns: string[];
    inputSchema: Record<string, any>;
    code?: string;
    enabled: boolean;
    isBuiltIn?: boolean;
}
