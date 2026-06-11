export interface ToolExecutionLog {
  id: string;
  type: 'MCP' | 'WebMCP';
  toolName: string;
  args: any;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'pending' | 'success' | 'error';
  result?: any;
  error?: string;
  script?: string;
}
