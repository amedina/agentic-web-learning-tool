import { memo, useState, useEffect, useCallback } from "react";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  cn,
} from "@google-awlt/design-system";
import { LogView, type LogEntry } from "./LogView";
import { ResourceView } from "./ResourceView";
import { ToolView } from "./ToolView";
import { PromptView } from "./PromptView";

interface MCPInspectorTabProps {
  client: Client;
  className?: string;
}

export const MCPInspectorTab = memo(function MCPInspectorTab({
  client,
  className,
}: MCPInspectorTabProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [tools, setTools] = useState<any[]>([]);
  const [prompts, setPrompts] = useState<any[]>([]);

  // Memoized handlers
  const addLog = useCallback((entry: LogEntry) => {
    setLogs((prev) => [...prev, entry]);
  }, []);

  const refreshData = useCallback(async () => {
    try {
      const toolList = await client.listTools();
      setTools(toolList.tools);
    } catch (e) {
      console.error("Failed to list tools", e);
    }

    try {
      const resourceList = await client.listResources();
      setResources(resourceList.resources);
    } catch (e) {
      console.error("Failed to list resources", e);
    }

    try {
      const promptList = await client.listPrompts();
      setPrompts(promptList.prompts);
    } catch (e) {
      console.error("Failed to list prompts", e);
    }
  }, [client]);

  // Initial load
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Protocol logging setup could go here if we can hook into connection
  // dependent on how client is exposed/constructed.
  // For now, assuming passive inspection via periodic refresh or event listeners if available.

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-background text-foreground",
        className,
      )}
    >
      <Tabs defaultValue="tools" className="flex flex-col h-full">
        <div className="border-b px-4 py-2">
          <TabsList>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="prompts">Prompts</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="resources" className="h-full m-0 p-0 border-none">
            <ResourceView resources={resources} onRefresh={refreshData} />
          </TabsContent>
          <TabsContent value="prompts" className="h-full m-0 p-0 border-none">
            <PromptView
              prompts={prompts}
              onExecute={async (name, args) => {
                try {
                  const result = await client.getPrompt({
                    name,
                    arguments: args,
                  });
                  addLog({
                    timestamp: Date.now(),
                    type: "response",
                    direction: "inbound",
                    method: "prompts/get",
                    result,
                  });
                } catch (e) {
                  addLog({
                    timestamp: Date.now(),
                    type: "error",
                    direction: "inbound",
                    error: e,
                  });
                }
              }}
            />
          </TabsContent>
          <TabsContent value="tools" className="h-full m-0 p-0 border-none">
            <ToolView
              tools={tools}
              onExecute={async (name, args) => {
                try {
                  addLog({
                    timestamp: Date.now(),
                    type: "request",
                    direction: "outbound",
                    method: "tools/call",
                    params: { name, arguments: args },
                  });
                  const result = await client.callTool({
                    name,
                    arguments: args,
                  });
                  addLog({
                    timestamp: Date.now(),
                    type: "response",
                    direction: "inbound",
                    method: "tools/call",
                    result,
                  });
                } catch (e) {
                  addLog({
                    timestamp: Date.now(),
                    type: "error",
                    direction: "inbound",
                    error: e,
                  });
                }
              }}
            />
          </TabsContent>
          <TabsContent value="logs" className="h-full m-0 p-0 border-none">
            <LogView logs={logs} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
});
