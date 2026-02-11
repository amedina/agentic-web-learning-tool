/**
 * External dependencies
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  type Prompt,
  type Resource,
  type Tool,
  type CreateMessageResult,
  type LoggingLevel,
  type Root,
  type ServerNotification,
} from "@modelcontextprotocol/sdk/types.js";
import { OAuthTokensSchema } from "@modelcontextprotocol/sdk/shared/auth.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
/**
 * Internal dependencies
 */
import { SESSION_KEYS, getServerSpecificKey } from "../../lib/constants";
import {
  hasValidMetaName,
  hasValidMetaPrefix,
  isReservedMetaKey,
} from "../../utils/metaUtils";
import {
  type AuthDebuggerState,
  EMPTY_DEBUGGER_STATE,
} from "../../lib/auth-types";
import { OAuthStateMachine } from "../../lib/oauth-state-machine";
import { useConnection } from "../../lib/hooks/useConnection";
import type { InspectorConfig } from "../../lib/configurationTypes";
import {
  getMCPProxyAddress,
  getMCPProxyAuthToken,
  getInitialSseUrl,
  getInitialTransportType,
  saveInspectorConfig,
} from "../../utils/configUtils";
import { type PendingElicitationRequest } from "../../components/ElicitationTab";
import { type PendingRequest } from "../../components/SamplingTab";
import {
  type CustomHeaders,
  migrateFromLegacyAuth,
} from "../../lib/types/customHeaders";
import type { ElicitationResponse } from "../../components/ElicitationTab";
import McpConnectionContext, { LOCALSTORAGEMOCK } from "./context";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";

const CONFIG_LOCAL_STORAGE_KEY = "inspectorConfig_v1";

const filterReservedMetadata = (
  metadata: Record<string, string>,
): Record<string, string> => {
  return Object.entries(metadata).reduce<Record<string, string>>(
    (acc, [key, value]) => {
      if (
        !isReservedMetaKey(key) &&
        hasValidMetaPrefix(key) &&
        hasValidMetaName(key)
      ) {
        acc[key] = value;
      }
      return acc;
    },
    {},
  );
};

const McpConnectionProvider = ({
  children,
  client,
  transport,
}: {
  children: ReactNode;
  client: Client | null;
  transport: Transport | null;
}) => {
  const [sseUrl, setSseUrl] = useState<string>(getInitialSseUrl);
  const [pingResults, setPingResults] = useState<any[]>([]);
  const [transportType, setTransportType] = useState<"sse" | "streamable-http">(
    getInitialTransportType,
  );
  const [connectionType, setConnectionType] = useState<"direct" | "proxy">(
    () => {
      return (
        (localStorage.getItem("lastConnectionType") as "direct" | "proxy") ||
        "proxy"
      );
    },
  );

  const [logLevel, setLogLevel] = useState<LoggingLevel>("debug");
  const [notifications, setNotifications] = useState<ServerNotification[]>([]);
  const [roots, setRoots] = useState<Root[]>([]);
  const [config, setConfig] = useState<InspectorConfig>(LOCALSTORAGEMOCK);

  // Auth
  const [bearerToken, setBearerToken] = useState<string>(() => {
    return localStorage.getItem("lastBearerToken") || "";
  });
  const [headerName, setHeaderName] = useState<string>(() => {
    return localStorage.getItem("lastHeaderName") || "";
  });
  const [oauthClientId, setOauthClientId] = useState<string>(() => {
    return localStorage.getItem("lastOauthClientId") || "";
  });
  const [oauthScope, setOauthScope] = useState<string>(() => {
    return localStorage.getItem("lastOauthScope") || "";
  });
  const [oauthClientSecret, setOauthClientSecret] = useState<string>(() => {
    return localStorage.getItem("lastOauthClientSecret") || "";
  });

  const [customHeaders, setCustomHeaders] = useState<CustomHeaders>(() => {
    const savedHeaders = localStorage.getItem("lastCustomHeaders");
    if (savedHeaders) {
      try {
        return JSON.parse(savedHeaders);
      } catch (error) {
        console.warn(
          `Failed to parse custom headers: "${savedHeaders}", will try legacy migration`,
          error,
        );
      }
    }
    const legacyToken = localStorage.getItem("lastBearerToken") || "";
    const legacyHeaderName = localStorage.getItem("lastHeaderName") || "";
    if (legacyToken) {
      return migrateFromLegacyAuth(legacyToken, legacyHeaderName);
    }
    return [
      {
        name: "Authorization",
        value: "Bearer ",
        enabled: false,
      },
    ];
  });

  const [pendingSampleRequests, setPendingSampleRequests] = useState<
    Array<
      PendingRequest & {
        resolve: (result: CreateMessageResult) => void;
        reject: (error: Error) => void;
      }
    >
  >([]);
  const [pendingElicitationRequests, setPendingElicitationRequests] = useState<
    Array<
      PendingElicitationRequest & {
        resolve: (response: ElicitationResponse) => void;
        decline: (error: Error) => void;
      }
    >
  >([]);
  const [isAuthDebuggerVisible, setIsAuthDebuggerVisible] = useState(false);
  const [authState, setAuthState] =
    useState<AuthDebuggerState>(EMPTY_DEBUGGER_STATE);

  const [metadata, setMetadata] = useState<Record<string, string>>(() => {
    const savedMetadata = localStorage.getItem("lastMetadata");
    if (savedMetadata) {
      try {
        const parsed = JSON.parse(savedMetadata);
        if (parsed && typeof parsed === "object") {
          return filterReservedMetadata(parsed);
        }
      } catch (error) {
        console.warn("Failed to parse saved metadata:", error);
      }
    }
    return {};
  });

  const [activeTab, setActiveTab] = useState<string>(() => {
    const hash = window.location.hash.slice(1);
    const initialTab = hash || "resources";
    return initialTab;
  });

  const [resources, setResources] = useState<Resource[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);

  const onDisconnect = useCallback(() => {
    setTools([]);
    setResources([]);
    setPrompts([]);
    setPingResults([]);
  }, []);

  const updateAuthState = useCallback((updates: Partial<AuthDebuggerState>) => {
    setAuthState((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleMetadataChange = useCallback(
    (newMetadata: Record<string, string>) => {
      const sanitizedMetadata = filterReservedMetadata(newMetadata);
      setMetadata(sanitizedMetadata);
      localStorage.setItem("lastMetadata", JSON.stringify(sanitizedMetadata));
    },
    [],
  );

  const nextRequestId = useRef(0);
  const rootsRef = useRef<Root[]>([]);
  const currentTabRef = useRef<string>(activeTab);
  const lastToolCallOriginTabRef = useRef<string>(activeTab);

  useEffect(() => {
    currentTabRef.current = activeTab;
  }, [activeTab]);

  const {
    connectionStatus,
    serverCapabilities,
    serverImplementation,
    mcpClient,
    requestHistory,
    clearRequestHistory,
    makeRequest,
    sendNotification,
    handleCompletion,
    completionsSupported,
    connect: connectMcpServer,
    disconnect: disconnectMcpServer,
  } = useConnection({
    sseUrl,
    oauthClientId,
    oauthClientSecret,
    oauthScope,
    config,
    connectionType,
    onNotification: (notification) => {
      setNotifications((prev) => [...prev, notification as ServerNotification]);
    },
    onPendingRequest: (request, resolve, reject) => {
      setPendingSampleRequests((prev) => [
        ...prev,
        { id: nextRequestId.current++, request, resolve, reject },
      ]);
    },
    onElicitationRequest: (request, resolve) => {
      const currentTab = lastToolCallOriginTabRef.current;
      setPendingElicitationRequests((prev) => [
        ...prev,
        {
          id: nextRequestId.current++,
          request: {
            id: nextRequestId.current,
            message: request.params.message,
            requestedSchema: request.params.requestedSchema,
          },
          originatingTab: currentTab,
          resolve,
          decline: (error: Error) => {
            console.error("Elicitation request rejected:", error);
          },
        },
      ]);
      setActiveTab("elicitations");
      // Note: Updating hash directly here.
      // In the App component, this logic still works as we are binding activeTab to hash there too?
      // Or should we remove hash handling from here?
      // Since window is global, this still works.
      window.location.hash = "elicitations";
    },
    getRoots: () => rootsRef.current,
    defaultLoggingLevel: logLevel,
    metadata,
    onDisconnect,
  });

  useEffect(() => {
    if (serverCapabilities) {
      const hash = window.location.hash.slice(1);
      const validTabs = [
        ...(serverCapabilities?.resources ? ["resources"] : []),
        ...(serverCapabilities?.prompts ? ["prompts"] : []),
        ...(serverCapabilities?.tools ? ["tools"] : []),
        "ping",
        "sampling",
        "elicitations",
        "roots",
        "auth",
      ];
      const isValidTab = validTabs.includes(hash);
      if (!isValidTab) {
        const defaultTab = serverCapabilities?.resources
          ? "resources"
          : serverCapabilities?.prompts
            ? "prompts"
            : serverCapabilities?.tools
              ? "tools"
              : "ping";
        setActiveTab(defaultTab);
        window.location.hash = defaultTab;
      }
    }
  }, [serverCapabilities]);

  useEffect(() => {
    localStorage.setItem("lastSseUrl", sseUrl);
  }, [sseUrl]);

  useEffect(() => {
    localStorage.setItem("lastTransportType", transportType);
  }, [transportType]);

  useEffect(() => {
    localStorage.setItem("lastConnectionType", connectionType);
  }, [connectionType]);

  useEffect(() => {
    if (bearerToken) {
      localStorage.setItem("lastBearerToken", bearerToken);
    } else {
      localStorage.removeItem("lastBearerToken");
    }
  }, [bearerToken]);

  useEffect(() => {
    if (headerName) {
      localStorage.setItem("lastHeaderName", headerName);
    } else {
      localStorage.removeItem("lastHeaderName");
    }
  }, [headerName]);

  useEffect(() => {
    localStorage.setItem("lastCustomHeaders", JSON.stringify(customHeaders));
  }, [customHeaders]);

  useEffect(() => {
    if (customHeaders.length === 0 && (bearerToken || headerName)) {
      const migratedHeaders = migrateFromLegacyAuth(bearerToken, headerName);
      if (migratedHeaders.length > 0) {
        setCustomHeaders(migratedHeaders);
        setBearerToken("");
        setHeaderName("");
      }
    }
  }, [bearerToken, headerName, customHeaders]);

  useEffect(() => {
    localStorage.setItem("lastOauthClientId", oauthClientId);
  }, [oauthClientId]);

  useEffect(() => {
    localStorage.setItem("lastOauthScope", oauthScope);
  }, [oauthScope]);

  useEffect(() => {
    localStorage.setItem("lastOauthClientSecret", oauthClientSecret);
  }, [oauthClientSecret]);

  useEffect(() => {
    saveInspectorConfig(CONFIG_LOCAL_STORAGE_KEY, config);
  }, [config]);

  useEffect(() => {
    const headers: HeadersInit = {};
    const { token: proxyAuthToken, header: proxyAuthTokenHeader } =
      getMCPProxyAuthToken(config);
    if (proxyAuthToken) {
      headers[proxyAuthTokenHeader] = `Bearer ${proxyAuthToken}`;
    }

    if (getMCPProxyAddress(config).startsWith("chrome-extension")) {
      return;
    }

    fetch(`${getMCPProxyAddress(config)}/config`, { headers })
      .then((response) => response.json())
      .then((data) => {
        if (data.defaultTransport) {
          setTransportType(data.defaultTransport as "sse" | "streamable-http");
        }
        if (data.defaultServerUrl) {
          setSseUrl(data.defaultServerUrl);
        }
      })
      .catch((error) =>
        console.error("Error fetching default environment:", error),
      );
  }, [config]);

  useEffect(() => {
    rootsRef.current = roots;
  }, [roots]);

  useEffect(() => {
    if (mcpClient && !window.location.hash) {
      const defaultTab = serverCapabilities?.resources
        ? "resources"
        : serverCapabilities?.prompts
          ? "prompts"
          : serverCapabilities?.tools
            ? "tools"
            : "ping";
      window.location.hash = defaultTab;
    } else if (!mcpClient && window.location.hash) {
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      );
    }
  }, [mcpClient, serverCapabilities]);

  const onOAuthConnect = useCallback(
    (serverUrl: string) => {
      if (!client || !transport) {
        return;
      }
      setSseUrl(serverUrl);
      setIsAuthDebuggerVisible(false);
      void connectMcpServer(client, transport);
    },
    [connectMcpServer, client, transport],
  );

  const onOAuthDebugConnect = useCallback(
    async ({
      authorizationCode,
      errorMsg,
      restoredState,
    }: {
      authorizationCode?: string;
      errorMsg?: string;
      restoredState?: AuthDebuggerState;
    }) => {
      setIsAuthDebuggerVisible(true);

      if (errorMsg) {
        updateAuthState({
          latestError: new Error(errorMsg),
        });
        return;
      }

      if (restoredState && authorizationCode) {
        let currentState: AuthDebuggerState = {
          ...restoredState,
          authorizationCode,
          oauthStep: "token_request",
          isInitiatingAuth: true,
          statusMessage: null,
          latestError: null,
        };

        try {
          const stateMachine = new OAuthStateMachine(sseUrl, (updates) => {
            currentState = { ...currentState, ...updates };
          });

          while (
            currentState.oauthStep !== "complete" &&
            currentState.oauthStep !== "authorization_code"
          ) {
            await stateMachine.executeStep(currentState);
          }

          if (currentState.oauthStep === "complete") {
            updateAuthState({
              ...currentState,
              statusMessage: {
                type: "success",
                message: "Authentication completed successfully",
              },
              isInitiatingAuth: false,
            });
          }
        } catch (error) {
          console.error("OAuth continuation error:", error);
          updateAuthState({
            latestError:
              error instanceof Error ? error : new Error(String(error)),
            statusMessage: {
              type: "error",
              message: `Failed to complete OAuth flow: ${error instanceof Error ? error.message : String(error)}`,
            },
            isInitiatingAuth: false,
          });
        }
      } else if (authorizationCode) {
        updateAuthState({
          authorizationCode,
          oauthStep: "token_request",
        });
      }
    },
    [sseUrl, updateAuthState],
  );

  useEffect(() => {
    const loadOAuthTokens = async () => {
      try {
        if (sseUrl) {
          const key = getServerSpecificKey(SESSION_KEYS.TOKENS, sseUrl);
          const tokens = sessionStorage.getItem(key);
          if (tokens) {
            const parsedTokens = await OAuthTokensSchema.parseAsync(
              JSON.parse(tokens),
            );
            updateAuthState({
              oauthTokens: parsedTokens,
              oauthStep: "complete",
            });
          }
        }
      } catch (error) {
        console.error("Error loading OAuth tokens:", error);
      }
    };

    loadOAuthTokens();
  }, [sseUrl, updateAuthState]);

  const handleApproveSampling = useCallback(
    (id: number, result: CreateMessageResult) => {
      setPendingSampleRequests((prev) => {
        const request = prev.find((r) => r.id === id);
        request?.resolve(result);
        return prev.filter((r) => r.id !== id);
      });
    },
    [],
  );

  const handleRejectSampling = useCallback((id: number) => {
    setPendingSampleRequests((prev) => {
      const request = prev.find((r) => r.id === id);
      request?.reject(new Error("Sampling request rejected"));
      return prev.filter((r) => r.id !== id);
    });
  }, []);

  const handleResolveElicitation = useCallback(
    (id: number, response: ElicitationResponse) => {
      setPendingElicitationRequests((prev) => {
        const request = prev.find((r) => r.id === id);
        if (request) {
          request.resolve(response);

          if (request.originatingTab) {
            const originatingTab = request.originatingTab;
            const validTabs = [
              ...(serverCapabilities?.resources ? ["resources"] : []),
              ...(serverCapabilities?.prompts ? ["prompts"] : []),
              ...(serverCapabilities?.tools ? ["tools"] : []),
              "ping",
              "sampling",
              "elicitations",
              "roots",
              "auth",
            ];

            if (validTabs.includes(originatingTab)) {
              setActiveTab(originatingTab);
              window.location.hash = originatingTab;

              setTimeout(() => {
                setActiveTab(originatingTab);
                window.location.hash = originatingTab;
              }, 100);
            }
          }
        }
        return prev.filter((r) => r.id !== id);
      });
    },
    [
      serverCapabilities?.prompts,
      serverCapabilities?.resources,
      serverCapabilities?.tools,
    ],
  );

  const value = useMemo(() => {
    return {
      state: {
        sseUrl,
        connectionType,
        transportType,
        logLevel,
        config,
        bearerToken,
        headerName,
        customHeaders,
        oauthClientId,
        oauthScope,
        oauthClientSecret,
        isAuthDebuggerVisible,
        authState,
        metadata,
        connectionStatus,
        serverCapabilities,
        serverImplementation,
        mcpClient,
        requestHistory,
        completionsSupported,
        notifications,
        roots,
        activeTab,
        lastToolCallOriginTabRef,
        pendingSampleRequests,
        pendingElicitationRequests,
        resources,
        tools,
        prompts,
        pingResults,
      },
      actions: {
        setSseUrl,
        setTransportType,
        setConnectionType,
        setLogLevel,
        setConfig,
        setBearerToken,
        setHeaderName,
        setCustomHeaders,
        setOauthClientId,
        setOauthScope,
        setOauthClientSecret,
        setIsAuthDebuggerVisible,
        updateAuthState,
        onOAuthConnect,
        onOAuthDebugConnect,
        handleMetadataChange,
        clearRequestHistory,
        makeRequest,
        sendNotification,
        handleCompletion,
        connectMcpServer,
        handleApproveSampling,
        handleRejectSampling,
        handleResolveElicitation,
        setRoots,
        setActiveTab,
        setResources,
        setPrompts,
        setTools,
        disconnectMcpServer,
        setPingResults,
      },
    };
  }, [
    sseUrl,
    connectionType,
    transportType,
    logLevel,
    config,
    bearerToken,
    headerName,
    customHeaders,
    oauthClientId,
    oauthScope,
    oauthClientSecret,
    isAuthDebuggerVisible,
    authState,
    metadata,
    connectionStatus,
    serverCapabilities,
    serverImplementation,
    mcpClient,
    requestHistory,
    completionsSupported,
    notifications,
    roots,
    activeTab,
    lastToolCallOriginTabRef,
    pendingSampleRequests,
    pendingElicitationRequests,
    resources,
    prompts,
    tools,
    updateAuthState,
    onOAuthConnect,
    onOAuthDebugConnect,
    handleMetadataChange,
    clearRequestHistory,
    makeRequest,
    sendNotification,
    handleCompletion,
    connectMcpServer,
    handleApproveSampling,
    handleRejectSampling,
    handleResolveElicitation,
    disconnectMcpServer,
    pingResults,
  ]);

  return (
    <McpConnectionContext.Provider value={value}>
      {children}
    </McpConnectionContext.Provider>
  );
};

export default McpConnectionProvider;
