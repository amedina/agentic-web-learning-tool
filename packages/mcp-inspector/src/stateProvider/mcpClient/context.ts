/**
 * External dependencies
 */
import { createContext, noop } from "@google-awlt/common";
import { type Dispatch, type SetStateAction } from "react";
import {
  type ClientRequest,
  type ClientNotification,
  type CreateMessageResult,
  type LoggingLevel,
  type Root,
  type ServerNotification,
  type Resource,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";
/**
 * Internal dependencies
 */
import { type ConnectionStatus } from "../../lib/constants";
import {
  EMPTY_DEBUGGER_STATE,
  type AuthDebuggerState,
} from "../../lib/auth-types";
import type { InspectorConfig } from "../../lib/configurationTypes";
import { type PendingElicitationRequest } from "../../components/ElicitationTab";
import { type PendingRequest } from "../../components/SamplingTab";
import { type CustomHeaders } from "../../lib/types/customHeaders";
import type { ElicitationResponse } from "../../components/ElicitationTab";
import { type Prompt } from "../../components/PromptsTab";

export const LOCALSTORAGEMOCK = {
  MCP_SERVER_REQUEST_TIMEOUT: {
    label: "Request Timeout",
    description:
      "Client-side timeout (ms) - Inspector will cancel requests after this time",
    value: 300000,
    is_session_item: false,
  },
  MCP_REQUEST_TIMEOUT_RESET_ON_PROGRESS: {
    label: "Reset Timeout on Progress",
    description: "Reset timeout on progress notifications",
    value: true,
    is_session_item: false,
  },
  MCP_REQUEST_MAX_TOTAL_TIMEOUT: {
    label: "Maximum Total Timeout",
    description:
      "Maximum total timeout for requests sent to the MCP server (ms) (Use with progress notifications)",
    value: 60000,
    is_session_item: false,
  },
  MCP_PROXY_FULL_ADDRESS: {
    label: "Inspector Proxy Address",
    description:
      "Set this if you are running the MCP Inspector Proxy on a non-default address. Example: http://10.1.1.22:5577",
    value: "",
    is_session_item: false,
  },
  MCP_PROXY_AUTH_TOKEN: {
    label: "Maximum Total Timeout",
    description:
      "Maximum total timeout for requests sent to the MCP server (ms) (Use with progress notifications)",
    value: "43aa583a587846f3b731c3ba921a98d6a7855b013baeff00b81f6187a5d74997",
    is_session_item: false,
  },
};

export interface McpConnectionContextType {
  state: {
    sseUrl: string;
    connectionType: "direct" | "proxy";
    transportType: "stdio" | "sse" | "streamable-http";
    logLevel: LoggingLevel;
    config: InspectorConfig;
    bearerToken: string;
    headerName: string;
    customHeaders: CustomHeaders;
    oauthClientId: string;
    oauthScope: string;
    oauthClientSecret: string;
    isAuthDebuggerVisible: boolean;
    authState: AuthDebuggerState;
    metadata: Record<string, string>;
    connectionStatus: ConnectionStatus;
    serverCapabilities: any;
    serverImplementation: any;
    mcpClient: any;
    requestHistory: { request: string; response?: string }[];
    completionsSupported: boolean;
    notifications: ServerNotification[];
    roots: Root[];
    activeTab: string;
    lastToolCallOriginTabRef: React.MutableRefObject<string>;
    pendingSampleRequests: Array<
      PendingRequest & {
        resolve: (result: CreateMessageResult) => void;
        reject: (error: Error) => void;
      }
    >;
    pendingElicitationRequests: Array<
      PendingElicitationRequest & {
        resolve: (response: ElicitationResponse) => void;
        decline: (error: Error) => void;
      }
    >;
    resources: Resource[];
    tools: Tool[];
    prompts: Prompt[];
  };

  actions: {
    setSseUrl: (url: string) => void;
    setTransportType: (type: "sse" | "streamable-http") => void;
    setConnectionType: (type: "direct" | "proxy") => void;
    setLogLevel: (level: LoggingLevel) => void;
    setConfig: (config: InspectorConfig) => void;
    setBearerToken: (token: string) => void;
    setHeaderName: (name: string) => void;
    setCustomHeaders: (headers: CustomHeaders) => void;
    setOauthClientId: (id: string) => void;
    setOauthScope: (scope: string) => void;
    setOauthClientSecret: (secret: string) => void;
    setIsAuthDebuggerVisible: (visible: boolean) => void;
    updateAuthState: (updates: Partial<AuthDebuggerState>) => void;
    onOAuthConnect: (serverUrl: string) => void;
    onOAuthDebugConnect: (args: {
      authorizationCode?: string;
      errorMsg?: string;
      restoredState?: AuthDebuggerState;
    }) => Promise<void>;
    handleMetadataChange: (newMetadata: Record<string, string>) => void;
    clearRequestHistory: () => void;
    makeRequest: (request: ClientRequest, schema: any) => Promise<any>;
    sendNotification: (notification: ClientNotification) => Promise<void>;
    handleCompletion: (
      ref: any,
      argName: string,
      value: string,
      context?: Record<string, string>,
      signal?: AbortSignal,
    ) => Promise<string[]>;

    connectMcpServer: () => Promise<void>;
    disconnectMcpServer: () => void;
    handleApproveSampling: (id: number, result: CreateMessageResult) => void;
    handleRejectSampling: (id: number) => void;
    handleResolveElicitation: (
      id: number,
      response: ElicitationResponse,
    ) => void;
    setRoots: Dispatch<SetStateAction<Root[]>>;
    setActiveTab: (tab: string) => void;
    setPrompts: Dispatch<SetStateAction<Prompt[]>>;
    setResources: Dispatch<SetStateAction<Resource[]>>;
    setTools: Dispatch<SetStateAction<Tool[]>>;
  };
}

const INITIAL_STATE = {
  state: {
    sseUrl: "",
    connectionType:
      "direct" as McpConnectionContextType["state"]["connectionType"],
    transportType:
      "streamable-http" as McpConnectionContextType["state"]["transportType"],
    logLevel: "info" as McpConnectionContextType["state"]["logLevel"],
    config: LOCALSTORAGEMOCK,
    bearerToken: "",
    headerName: "",
    customHeaders: [],
    oauthClientId: "",
    oauthScope: "",
    oauthClientSecret: "",
    isAuthDebuggerVisible: false,
    authState: EMPTY_DEBUGGER_STATE,
    metadata: {},
    connectionStatus:
      "disconnected" as McpConnectionContextType["state"]["connectionStatus"],
    serverCapabilities: {},
    serverImplementation: {},
    mcpClient: {},
    requestHistory: [],
    completionsSupported: false,
    notifications: [],
    roots: [],
    activeTab: "",
    lastToolCallOriginTabRef: { current: "" },
    pendingSampleRequests: [],
    pendingElicitationRequests: [],
    tools: [],
    resources: [],
    prompts: [],
  },
  actions: {
    setSseUrl: noop,
    setTransportType: noop,
    setConnectionType: noop,
    setLogLevel: noop,
    setConfig: noop,
    setBearerToken: noop,
    setHeaderName: noop,
    setCustomHeaders: noop,
    setOauthClientId: noop,
    setOauthScope: noop,
    setOauthClientSecret: noop,
    setIsAuthDebuggerVisible: noop,
    updateAuthState: noop,
    onOAuthConnect: noop,
    onOAuthDebugConnect: () => Promise.resolve(),
    handleMetadataChange: noop,
    clearRequestHistory: noop,
    makeRequest: () => Promise.resolve(),
    sendNotification: () => Promise.resolve(),
    handleCompletion: () => Promise.resolve([]),
    connectMcpServer: () => Promise.resolve(),
    disconnectMcpServer: noop,
    handleApproveSampling: noop,
    handleRejectSampling: noop,
    handleResolveElicitation: noop,
    setRoots: noop,
    setActiveTab: noop,
    setPrompts: noop,
    setResources: noop,
    setTools: noop,
  },
};
export default createContext<McpConnectionContextType>(INITIAL_STATE);
