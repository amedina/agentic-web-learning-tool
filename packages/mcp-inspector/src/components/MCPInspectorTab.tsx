import { memo, useState, useEffect, useCallback } from "react";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { WebSocketClientTransport } from "@modelcontextprotocol/sdk/client/websocket.js";
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
import { ConnectionSidebar, type TransportType } from "./ConnectionSidebar";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

interface MCPInspectorTabProps {
  client: Client;
  className?: string;
}

export const MCPInspectorTab = memo(function MCPInspectorTab({
  client: initialClient,
  className,
}: MCPInspectorTabProps) {
  const [activeClient, setActiveClient] = useState<Client>(initialClient);
  const [isConnected, setIsConnected] = useState(false); // We assume initialClient might be connected, but strict state tracking is hard without events.
  // For the passed-in client, we assume it's "connected" enough or we just use it.
  // The sidebar controls manual connections.
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [tools, setTools] = useState<any[]>([]);
  const [prompts, setPrompts] = useState<any[]>([]);

  // Memoized handlers
  const addLog = useCallback((entry: LogEntry) => {
    setLogs((prev) => [...prev, entry]);
  }, []);

  const refreshData = useCallback(async () => {
    if (!activeClient) return;

    try {
      const toolList = await activeClient.listTools();
      setTools(toolList.tools);
    } catch (e) {
      console.error("Failed to list tools", e);
    }

    try {
      const resourceList = await activeClient.listResources();
      setResources(resourceList.resources);
    } catch (e) {
      console.error("Failed to list resources", e);
    }

    try {
      const promptList = await activeClient.listPrompts();
      setPrompts(promptList.prompts);
    } catch (e) {
      console.error("Failed to list prompts", e);
    }
  }, [activeClient]);

  // Initial load
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const handleConnect = async (transportType: TransportType, url: string) => {
    setConnectionError(null);
    try {
      let transport;
      if (transportType === "websocket") {
        transport = new WebSocketClientTransport(new URL(url));
      } else {
        transport = new StreamableHTTPClientTransport(new URL(url));
      }

      const newClient = new Client(
        {
          name: "MCP Inspector",
          version: "1.0.0",
        },
        {
          capabilities: {
            sampling: {},
          },
        },
      );

      await newClient.connect(transport);
      setActiveClient(newClient);
      setIsConnected(true); // Should we set this only if successful? Yes.

      // Clear previous data
      setLogs([]);
      setResources([]);
      setTools([]);
      setPrompts([]);

      // Refresh will be triggered by useEffect on activeClient change or we can call it.
      // But activeClient is in dep array of refreshData, so we might need useEffect there?
      // Actually refreshData dep contains activeClient.
      // But we need to call it.

      // Wait for state update to trigger effect?
      // Better to rely on effect, but we need to ensure effect runs when activeClient changes.
      // The current useEffect [refreshData] will run because refreshData changes when activeClient changes.
    } catch (e) {
      console.error("Failed to connect", e);
      setConnectionError(e instanceof Error ? e.message : String(e));
      setIsConnected(false);
    }
  };

  const handleDisconnect = async () => {
    if (activeClient) {
      try {
        await activeClient.close();
      } catch (e) {
        console.error("Error closing client", e);
      }
    }
    setIsConnected(false);
    setActiveClient(initialClient); // Revert to initial client or null?
    // If we revert to initialClient, we might be "connected" to it effectively?
    // Let's assume initialClient is a fallback.
  };

  // Update: If we switch activeClient, we should trigger data refresh.
  // We added activeClient to dependencies of refreshData.

  return (
    <div className={cn("flex h-full bg-background text-foreground", className)}>
      <ConnectionSidebar
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        isConnected={isConnected}
        connectionError={connectionError}
      />

      <div className="flex flex-col flex-1 h-full overflow-hidden border-l">
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
            <TabsContent
              value="resources"
              className="h-full m-0 p-0 border-none"
            >
              <ResourceView resources={resources} onRefresh={refreshData} />
            </TabsContent>
            <TabsContent value="prompts" className="h-full m-0 p-0 border-none">
              <PromptView
                prompts={prompts}
                onExecute={async (name, args) => {
                  if (!activeClient) return;
                  try {
                    const result = await activeClient.getPrompt({
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
                  if (!activeClient) return;
                  try {
                    addLog({
                      timestamp: Date.now(),
                      type: "request",
                      direction: "outbound",
                      method: "tools/call",
                      params: { name, arguments: args },
                    });
                    const result = await activeClient.callTool({
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
    </div>
  );
});
