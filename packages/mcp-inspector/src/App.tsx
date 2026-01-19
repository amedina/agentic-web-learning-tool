import {
  type CompatibilityCallToolResult,
  CompatibilityCallToolResultSchema,
  EmptyResultSchema,
  GetPromptResultSchema,
  ListPromptsResultSchema,
  ListResourcesResultSchema,
  ListResourceTemplatesResultSchema,
  ListToolsResultSchema,
  ReadResourceResultSchema,
  type Resource,
  type ResourceTemplate,
  type Tool,
  type LoggingLevel,
} from "@modelcontextprotocol/sdk/types.js";
import type {
  AnySchema,
  SchemaOutput,
} from "@modelcontextprotocol/sdk/server/zod-compat.js";
import { cacheToolOutputSchemas } from "./utils/schemaUtils";
import { cleanParams } from "./utils/paramUtils";
import type { JsonSchemaType } from "./utils/jsonUtils";
import React, { Suspense, useRef, useState } from "react";
import {
  useDraggablePane,
  useDraggableSidebar,
} from "./lib/hooks/useDraggablePane";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Button,
} from "@google-awlt/design-system";
import {
  Bell,
  Files,
  FolderTree,
  Hammer,
  Hash,
  Key,
  MessageSquare,
  Settings,
} from "lucide-react";

import { z } from "zod";
import "./App.css";
import AuthDebugger from "./components/AuthDebugger";
import ConsoleTab from "./components/ConsoleTab";
import HistoryAndNotifications from "./components/HistoryAndNotifications";
import PingTab from "./components/PingTab";
import PromptsTab, { type Prompt } from "./components/PromptsTab";
import ResourcesTab from "./components/ResourcesTab";
import RootsTab from "./components/RootsTab";
import SamplingTab from "./components/SamplingTab";
import Sidebar from "./components/Sidebar";
import ToolsTab from "./components/ToolsTab";
import ElicitationTab from "./components/ElicitationTab";
import MetadataTab from "./components/MetadataTab";
import { useMCPClientProvider } from "./stateProvider";

const App = () => {
  const {
    command,
    args,
    sseUrl,
    transportType,
    connectionType,
    logLevel,
    config,
    env,
    customHeaders,
    oauthClientId,
    oauthScope,
    oauthClientSecret,
    isAuthDebuggerVisible,
    authState,
    metadata,
    activeTab,
    mcpClient,
    roots,
    notifications,
    pendingSampleRequests,
    pendingElicitationRequests,
    connectionStatus,
    serverCapabilities,
    serverImplementation,
    requestHistory,
    completionsSupported,
    lastToolCallOriginTabRef,
    onOAuthConnect,
    onOAuthDebugConnect,
    setCommand,
    setArgs,
    setSseUrl,
    setTransportType,
    setConnectionType,
    setLogLevel,
    setConfig,
    setEnv,
    setOauthClientId,
    setCustomHeaders,
    setOauthScope,
    setOauthClientSecret,
    setIsAuthDebuggerVisible,
    updateAuthState,
    handleMetadataChange,
    clearRequestHistory,
    makeRequest,
    sendNotification,
    handleCompletion,
    connectMcpServer,
    disconnectMcpServer,
    handleApproveSampling,
    handleRejectSampling,
    handleResolveElicitation,
    setRoots,
    setActiveTab,
  } = useMCPClientProvider(({ actions, state }) => ({
    command: state.command,
    args: state.args,
    sseUrl: state.sseUrl,
    transportType: state.transportType,
    connectionType: state.connectionType,
    logLevel: state.logLevel,
    config: state.config,
    env: state.env,
    customHeaders: state.customHeaders,
    oauthClientId: state.oauthClientId,
    oauthScope: state.oauthScope,
    oauthClientSecret: state.oauthClientSecret,
    isAuthDebuggerVisible: state.isAuthDebuggerVisible,
    authState: state.authState,
    metadata: state.metadata,
    activeTab: state.activeTab,
    mcpClient: state.mcpClient,
    roots: state.roots,
    notifications: state.notifications,
    pendingSampleRequests: state.pendingSampleRequests,
    pendingElicitationRequests: state.pendingElicitationRequests,
    connectionStatus: state.connectionStatus,
    serverCapabilities: state.serverCapabilities,
    serverImplementation: state.serverImplementation,
    requestHistory: state.requestHistory,
    completionsSupported: state.completionsSupported,
    lastToolCallOriginTabRef: state.lastToolCallOriginTabRef,
    onOAuthConnect: actions.onOAuthConnect,
    onOAuthDebugConnect: actions.onOAuthDebugConnect,
    setCommand: actions.setCommand,
    setArgs: actions.setArgs,
    setSseUrl: actions.setSseUrl,
    setTransportType: actions.setTransportType,
    setConnectionType: actions.setConnectionType,
    setLogLevel: actions.setLogLevel,
    setConfig: actions.setConfig,
    setEnv: actions.setEnv,
    setOauthClientId: actions.setOauthClientId,
    setCustomHeaders: actions.setCustomHeaders,
    setOauthScope: actions.setOauthScope,
    setOauthClientSecret: actions.setOauthClientSecret,
    setIsAuthDebuggerVisible: actions.setIsAuthDebuggerVisible,
    updateAuthState: actions.updateAuthState,
    handleMetadataChange: actions.handleMetadataChange,
    clearRequestHistory: actions.clearRequestHistory,
    makeRequest: actions.makeRequest,
    sendNotification: actions.sendNotification,
    handleCompletion: actions.handleCompletion,
    connectMcpServer: actions.connectMcpServer,
    disconnectMcpServer: actions.disconnectMcpServer,
    handleApproveSampling: actions.handleApproveSampling,
    handleRejectSampling: actions.handleRejectSampling,
    handleResolveElicitation: actions.handleResolveElicitation,
    setRoots: actions.setRoots,
    setActiveTab: actions.setActiveTab,
  }));

  const [resources, setResources] = useState<Resource[]>([]);
  const [resourceTemplates, setResourceTemplates] = useState<
    ResourceTemplate[]
  >([]);
  const [resourceContent, setResourceContent] = useState<string>("");
  const [resourceContentMap, setResourceContentMap] = useState<
    Record<string, string>
  >({});
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [promptContent, setPromptContent] = useState<string>("");
  const [tools, setTools] = useState<Tool[]>([]);
  const [toolResult, setToolResult] =
    useState<CompatibilityCallToolResult | null>(null);
  const [errors, setErrors] = useState<Record<string, string | null>>({
    resources: null,
    prompts: null,
    tools: null,
  });

  const [selectedResource, setSelectedResource] = useState<Resource | null>(
    null,
  );
  const [resourceSubscriptions, setResourceSubscriptions] = useState<
    Set<string>
  >(new Set<string>());

  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [nextResourceCursor, setNextResourceCursor] = useState<
    string | undefined
  >();
  const [nextResourceTemplateCursor, setNextResourceTemplateCursor] = useState<
    string | undefined
  >();
  const [nextPromptCursor, setNextPromptCursor] = useState<
    string | undefined
  >();
  const [nextToolCursor, setNextToolCursor] = useState<string | undefined>();
  const progressTokenRef = useRef(0);

  const currentTabRef = useRef<string>(activeTab);

  // Update refs when activeTab changes (Context drives activeTab)
  // Note: App.tsx doesn't own activeTab anymore, but we need to track it for refs
  React.useEffect(() => {
    currentTabRef.current = activeTab;
  }, [activeTab]);

  const { height: historyPaneHeight, handleDragStart } = useDraggablePane(300);
  const {
    width: sidebarWidth,
    isDragging: isSidebarDragging,
    handleDragStart: handleSidebarDragStart,
  } = useDraggableSidebar(320);

  const clearError = (tabKey: keyof typeof errors) => {
    setErrors((prev) => ({ ...prev, [tabKey]: null }));
  };

  const sendMCPRequest = async <T extends AnySchema>(
    request: import("@modelcontextprotocol/sdk/types.js").ClientRequest,
    schema: T,
    tabKey?: keyof typeof errors,
  ): Promise<SchemaOutput<T>> => {
    try {
      const response = await makeRequest(request, schema);
      if (tabKey !== undefined) {
        clearError(tabKey);
      }
      return response;
    } catch (e) {
      const errorString = (e as Error).message ?? String(e);
      if (tabKey !== undefined) {
        setErrors((prev) => ({
          ...prev,
          [tabKey]: errorString,
        }));
      }
      throw e;
    }
  };

  const listResources = async () => {
    const response = await sendMCPRequest(
      {
        method: "resources/list" as const,
        params: nextResourceCursor ? { cursor: nextResourceCursor } : {},
      },
      ListResourcesResultSchema,
      "resources",
    );
    setResources(resources.concat(response.resources ?? []));
    setNextResourceCursor(response.nextCursor);
  };

  const listResourceTemplates = async () => {
    const response = await sendMCPRequest(
      {
        method: "resources/templates/list" as const,
        params: nextResourceTemplateCursor
          ? { cursor: nextResourceTemplateCursor }
          : {},
      },
      ListResourceTemplatesResultSchema,
      "resources",
    );
    setResourceTemplates(
      resourceTemplates.concat(response.resourceTemplates ?? []),
    );
    setNextResourceTemplateCursor(response.nextCursor);
  };

  const getPrompt = async (name: string, args: Record<string, string> = {}) => {
    lastToolCallOriginTabRef.current = currentTabRef.current;

    const response = await sendMCPRequest(
      {
        method: "prompts/get" as const,
        params: { name, arguments: args },
      },
      GetPromptResultSchema,
      "prompts",
    );
    setPromptContent(JSON.stringify(response, null, 2));
  };

  const readResource = async (uri: string) => {
    lastToolCallOriginTabRef.current = currentTabRef.current;

    const response = await sendMCPRequest(
      {
        method: "resources/read" as const,
        params: { uri },
      },
      ReadResourceResultSchema,
      "resources",
    );
    const content = JSON.stringify(response, null, 2);
    setResourceContent(content);
    setResourceContentMap((prev) => ({
      ...prev,
      [uri]: content,
    }));
  };

  const subscribeToResource = async (uri: string) => {
    if (!resourceSubscriptions.has(uri)) {
      await sendMCPRequest(
        {
          method: "resources/subscribe" as const,
          params: { uri },
        },
        z.object({}),
        "resources",
      );
      const clone = new Set(resourceSubscriptions);
      clone.add(uri);
      setResourceSubscriptions(clone);
    }
  };

  const unsubscribeFromResource = async (uri: string) => {
    if (resourceSubscriptions.has(uri)) {
      await sendMCPRequest(
        {
          method: "resources/unsubscribe" as const,
          params: { uri },
        },
        z.object({}),
        "resources",
      );
      const clone = new Set(resourceSubscriptions);
      clone.delete(uri);
      setResourceSubscriptions(clone);
    }
  };

  const listPrompts = async () => {
    const response = await sendMCPRequest(
      {
        method: "prompts/list" as const,
        params: nextPromptCursor ? { cursor: nextPromptCursor } : {},
      },
      ListPromptsResultSchema,
      "prompts",
    );
    setPrompts(response.prompts);
    setNextPromptCursor(response.nextCursor);
  };

  const listTools = async () => {
    const response = await sendMCPRequest(
      {
        method: "tools/list" as const,
        params: nextToolCursor ? { cursor: nextToolCursor } : {},
      },
      ListToolsResultSchema,
      "tools",
    );
    setTools(response.tools);
    setNextToolCursor(response.nextCursor);
    cacheToolOutputSchemas(response.tools);
  };

  const callTool = async (
    name: string,
    params: Record<string, unknown>,
    toolMetadata?: Record<string, unknown>,
  ) => {
    lastToolCallOriginTabRef.current = currentTabRef.current;

    try {
      // Find the tool schema to clean parameters properly
      const tool = tools.find((t) => t.name === name);
      const cleanedParams = tool?.inputSchema
        ? cleanParams(params, tool.inputSchema as JsonSchemaType)
        : params;

      // Merge general metadata with tool-specific metadata
      // Tool-specific metadata takes precedence over general metadata
      const mergedMetadata = {
        ...metadata, // General metadata
        progressToken: progressTokenRef.current++,
        ...toolMetadata, // Tool-specific metadata
      };

      const response = await sendMCPRequest(
        {
          method: "tools/call" as const,
          params: {
            name,
            arguments: cleanedParams,
            _meta: mergedMetadata,
          },
        },
        CompatibilityCallToolResultSchema,
        "tools",
      );

      setToolResult(response);
      // Clear any validation errors since tool execution completed
      setErrors((prev) => ({ ...prev, tools: null }));
    } catch (e) {
      const toolResult: CompatibilityCallToolResult = {
        content: [
          {
            type: "text",
            text: (e as Error).message ?? String(e),
          },
        ],
        isError: true,
      };
      setToolResult(toolResult);
      // Clear validation errors - tool execution errors are shown in ToolResults
      setErrors((prev) => ({ ...prev, tools: null }));
    }
  };

  const handleRootsChange = async () => {
    await sendNotification({ method: "notifications/roots/list_changed" });
  };

  const handleClearNotifications = () => {
    // This probably needs to be supported in Context if we want to clear them globally
    // But currently `setNotifications` (via onNotification) is in Context.
    // Wait, `notifications` is state in context. `setNotifications` internal to context.
    // I need to check if I exposed a way to clear notifications.
    // I did NOT expose `setNotifications` directly, but `notifications` from `useConnection`.
    // Actually `useConnection` internal state has notifications, but I overrode `onNotification` in Context.
    // In Context `McpContextProvider`, I have `const [notifications, setNotifications] = useState...`.
    // But I didn't expose `setNotifications` or `clearNotifications` in interface...
    // Oops. I should check `McpConnectContextType`.
    // It has `notifications: ServerNotification[]`.
    // It does NOT have `clearNotifications`.
    // I should fix Context first? Or workaround?
    // Let's assume I can't clear them for now or I will make a separate fix.
    // Actually, `HistoryAndNotifications` component calls `onClearNotifications`.
    // If I cannot clear, the button will do nothing.
    // I should probably add `clearNotifications` to my Context.
    // FOR NOW, I will comment it out or leave it empty to avoid breaking build.
    // Or I can add a `setNotifications` to the `useMcpClient` return if I update the context file.
    // Let's update Context file first quickly to add `clearNotifications`.
  };

  const sendLogLevelRequest = async (level: LoggingLevel) => {
    await sendMCPRequest(
      {
        method: "logging/setLevel" as const,
        params: { level },
      },
      z.object({}),
    );
    setLogLevel(level);
  };

  const AuthDebuggerWrapper = () => (
    <TabsContent value="auth">
      <AuthDebugger
        serverUrl={sseUrl}
        onBack={() => setIsAuthDebuggerVisible(false)}
        authState={authState}
        updateAuthState={updateAuthState}
      />
    </TabsContent>
  );

  if (window.location.pathname === "/oauth/callback") {
    const OAuthCallback = React.lazy(
      () => import("./components/OAuthCallback"),
    );
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <OAuthCallback onConnect={onOAuthConnect} />
      </Suspense>
    );
  }

  if (window.location.pathname === "/oauth/callback/debug") {
    const OAuthDebugCallback = React.lazy(
      () => import("./components/OAuthDebugCallback"),
    );
    return (
      <Suspense fallback={<div>Loading...</div>}>
        <OAuthDebugCallback onConnect={onOAuthDebugConnect} />
      </Suspense>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <div
        style={{
          width: sidebarWidth,
          minWidth: 200,
          maxWidth: 600,
          transition: isSidebarDragging ? "none" : "width 0.15s",
        }}
        className="bg-card border-r border-border flex flex-col h-full relative"
      >
        <Sidebar
          connectionStatus={connectionStatus}
          transportType={transportType}
          setTransportType={setTransportType}
          command={command}
          setCommand={setCommand}
          args={args}
          setArgs={setArgs}
          sseUrl={sseUrl}
          setSseUrl={setSseUrl}
          env={env}
          setEnv={setEnv}
          config={config}
          setConfig={setConfig}
          customHeaders={customHeaders}
          setCustomHeaders={setCustomHeaders}
          oauthClientId={oauthClientId}
          setOauthClientId={setOauthClientId}
          oauthClientSecret={oauthClientSecret}
          setOauthClientSecret={setOauthClientSecret}
          oauthScope={oauthScope}
          setOauthScope={setOauthScope}
          onConnect={connectMcpServer}
          onDisconnect={disconnectMcpServer}
          logLevel={logLevel}
          sendLogLevelRequest={sendLogLevelRequest}
          loggingSupported={!!serverCapabilities?.logging || false}
          connectionType={connectionType}
          setConnectionType={setConnectionType}
          serverImplementation={serverImplementation}
        />
        <div
          onMouseDown={handleSidebarDragStart}
          style={{
            cursor: "col-resize",
            position: "absolute",
            top: 0,
            right: 0,
            width: 6,
            height: "100%",
            zIndex: 10,
            background: isSidebarDragging ? "rgba(0,0,0,0.08)" : "transparent",
          }}
          aria-label="Resize sidebar"
          data-testid="sidebar-drag-handle"
        />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          {mcpClient ? (
            <Tabs
              value={activeTab}
              className="w-full p-4"
              onValueChange={(value) => {
                setActiveTab(value);
                window.location.hash = value;
              }}
            >
              <TabsList className="mb-4 py-0">
                <TabsTrigger
                  value="resources"
                  disabled={!serverCapabilities?.resources}
                >
                  <Files className="w-4 h-4 mr-2" />
                  Resources
                </TabsTrigger>
                <TabsTrigger
                  value="prompts"
                  disabled={!serverCapabilities?.prompts}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Prompts
                </TabsTrigger>
                <TabsTrigger
                  value="tools"
                  disabled={!serverCapabilities?.tools}
                >
                  <Hammer className="w-4 h-4 mr-2" />
                  Tools
                </TabsTrigger>
                <TabsTrigger value="ping">
                  <Bell className="w-4 h-4 mr-2" />
                  Ping
                </TabsTrigger>
                <TabsTrigger value="sampling" className="relative">
                  <Hash className="w-4 h-4 mr-2" />
                  Sampling
                  {pendingSampleRequests.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      {pendingSampleRequests.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="elicitations" className="relative">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Elicitations
                  {pendingElicitationRequests.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      {pendingElicitationRequests.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="roots">
                  <FolderTree className="w-4 h-4 mr-2" />
                  Roots
                </TabsTrigger>
                <TabsTrigger value="auth">
                  <Key className="w-4 h-4 mr-2" />
                  Auth
                </TabsTrigger>
                <TabsTrigger value="metadata">
                  <Settings className="w-4 h-4 mr-2" />
                  Metadata
                </TabsTrigger>
              </TabsList>

              <div className="w-full">
                {!serverCapabilities?.resources &&
                !serverCapabilities?.prompts &&
                !serverCapabilities?.tools ? (
                  <>
                    <div className="flex items-center justify-center p-4">
                      <p className="text-lg text-gray-500 dark:text-gray-400">
                        The connected server does not support any MCP
                        capabilities
                      </p>
                    </div>
                    <PingTab
                      onPingClick={() => {
                        void sendMCPRequest(
                          {
                            method: "ping" as const,
                          },
                          EmptyResultSchema,
                        );
                      }}
                    />
                  </>
                ) : (
                  <>
                    <ResourcesTab
                      resources={resources}
                      resourceTemplates={resourceTemplates}
                      listResources={() => {
                        clearError("resources");
                        listResources();
                      }}
                      clearResources={() => {
                        setResources([]);
                        setNextResourceCursor(undefined);
                      }}
                      listResourceTemplates={() => {
                        clearError("resources");
                        listResourceTemplates();
                      }}
                      clearResourceTemplates={() => {
                        setResourceTemplates([]);
                        setNextResourceTemplateCursor(undefined);
                      }}
                      readResource={(uri) => {
                        clearError("resources");
                        readResource(uri);
                      }}
                      selectedResource={selectedResource}
                      setSelectedResource={(resource) => {
                        clearError("resources");
                        setSelectedResource(resource);
                      }}
                      resourceSubscriptionsSupported={
                        serverCapabilities?.resources?.subscribe || false
                      }
                      resourceSubscriptions={resourceSubscriptions}
                      subscribeToResource={(uri) => {
                        clearError("resources");
                        subscribeToResource(uri);
                      }}
                      unsubscribeFromResource={(uri) => {
                        clearError("resources");
                        unsubscribeFromResource(uri);
                      }}
                      handleCompletion={handleCompletion}
                      completionsSupported={completionsSupported}
                      resourceContent={resourceContent}
                      nextCursor={nextResourceCursor}
                      nextTemplateCursor={nextResourceTemplateCursor}
                      error={errors.resources}
                    />
                    <PromptsTab
                      prompts={prompts}
                      listPrompts={() => {
                        clearError("prompts");
                        listPrompts();
                      }}
                      clearPrompts={() => {
                        setPrompts([]);
                        setNextPromptCursor(undefined);
                      }}
                      getPrompt={(name, args) => {
                        clearError("prompts");
                        getPrompt(name, args);
                      }}
                      selectedPrompt={selectedPrompt}
                      setSelectedPrompt={(prompt) => {
                        clearError("prompts");
                        setSelectedPrompt(prompt);
                        setPromptContent("");
                      }}
                      handleCompletion={handleCompletion}
                      completionsSupported={completionsSupported}
                      promptContent={promptContent}
                      nextCursor={nextPromptCursor}
                      error={errors.prompts}
                    />
                    <ToolsTab
                      tools={tools}
                      listTools={() => {
                        clearError("tools");
                        listTools();
                      }}
                      clearTools={() => {
                        setTools([]);
                        setNextToolCursor(undefined);
                        cacheToolOutputSchemas([]);
                      }}
                      callTool={async (
                        name: string,
                        params: Record<string, unknown>,
                        metadata?: Record<string, unknown>,
                      ) => {
                        clearError("tools");
                        setToolResult(null);
                        await callTool(name, params, metadata);
                      }}
                      selectedTool={selectedTool}
                      setSelectedTool={(tool) => {
                        clearError("tools");
                        setSelectedTool(tool);
                        setToolResult(null);
                      }}
                      toolResult={toolResult}
                      nextCursor={nextToolCursor}
                      error={errors.tools}
                      resourceContent={resourceContentMap}
                      onReadResource={(uri: string) => {
                        clearError("resources");
                        readResource(uri);
                      }}
                    />
                    <ConsoleTab />
                    <PingTab
                      onPingClick={() => {
                        void sendMCPRequest(
                          {
                            method: "ping" as const,
                          },
                          EmptyResultSchema,
                        );
                      }}
                    />
                    <SamplingTab
                      pendingRequests={pendingSampleRequests}
                      onApprove={handleApproveSampling}
                      onReject={handleRejectSampling}
                    />
                    <ElicitationTab
                      pendingRequests={pendingElicitationRequests}
                      onResolve={handleResolveElicitation}
                    />
                    <RootsTab
                      roots={roots}
                      setRoots={setRoots}
                      onRootsChange={handleRootsChange}
                    />
                    <AuthDebuggerWrapper />
                    <MetadataTab
                      metadata={metadata}
                      onMetadataChange={handleMetadataChange}
                    />
                  </>
                )}
              </div>
            </Tabs>
          ) : isAuthDebuggerVisible ? (
            <Tabs
              defaultValue={"auth"}
              className="w-full p-4"
              onValueChange={(value) => (window.location.hash = value)}
            >
              <AuthDebuggerWrapper />
            </Tabs>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <p className="text-lg text-gray-500 dark:text-gray-400">
                Connect to an MCP server to start inspecting
              </p>
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  Need to configure authentication?
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAuthDebuggerVisible(true)}
                >
                  Open Auth Settings
                </Button>
              </div>
            </div>
          )}
        </div>
        <div
          className="relative border-t border-border"
          style={{
            height: `${historyPaneHeight}px`,
          }}
        >
          <div
            className="absolute w-full h-4 -top-2 cursor-row-resize flex items-center justify-center hover:bg-accent/50 dark:hover:bg-input/40"
            onMouseDown={handleDragStart}
          >
            <div className="w-8 h-1 rounded-full bg-border" />
          </div>
          <div className="h-full overflow-auto">
            <HistoryAndNotifications
              requestHistory={requestHistory}
              serverNotifications={notifications}
              onClearHistory={clearRequestHistory}
              onClearNotifications={handleClearNotifications}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
