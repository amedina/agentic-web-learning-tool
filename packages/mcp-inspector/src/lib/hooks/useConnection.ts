/**
 * External dependencies
 */
import { useCallback, useEffect, useState } from "react";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SseError } from "@modelcontextprotocol/sdk/client/sse.js";
import { StreamableHTTPError } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import {
  auth,
  discoverOAuthProtectedResourceMetadata,
} from "@modelcontextprotocol/sdk/client/auth.js";
import {
  type ClientNotification,
  type ClientRequest,
  CreateMessageRequestSchema,
  ListRootsRequestSchema,
  ResourceUpdatedNotificationSchema,
  LoggingMessageNotificationSchema,
  type ServerCapabilities,
  type PromptReference,
  type ResourceTemplateReference,
  McpError,
  CompleteResultSchema,
  ErrorCode,
  CancelledNotificationSchema,
  ResourceListChangedNotificationSchema,
  ToolListChangedNotificationSchema,
  PromptListChangedNotificationSchema,
  type Progress,
  type LoggingLevel,
  ElicitRequestSchema,
  type Implementation,
} from "@modelcontextprotocol/sdk/types.js";
import type {
  AnySchema,
  SchemaOutput,
} from "@modelcontextprotocol/sdk/server/zod-compat.js";
import type { RequestOptions } from "@modelcontextprotocol/sdk/shared/protocol.js";

/**
 * Internal dependencies
 */
import { useToast } from "./useToast";
import { type ConnectionStatus } from "../constants";
import type { Notification } from "../notificationTypes";
import {
  clearClientInformationFromSessionStorage,
  InspectorOAuthClientProvider,
  saveClientInformationToSessionStorage,
  saveScopeToSessionStorage,
  clearScopeFromSessionStorage,
  discoverScopes,
} from "../auth";
import {
  getMCPServerRequestMaxTotalTimeout,
  resetRequestTimeoutOnProgress,
  getMCPServerRequestTimeout,
} from "../../utils/configUtils";
import type { InspectorConfig } from "../configurationTypes";
import { resolveRefsInMessage } from "../../utils/schemaUtils";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";

interface UseConnectionOptions {
  sseUrl: string;
  oauthClientId?: string;
  oauthClientSecret?: string;
  oauthScope?: string;
  config: InspectorConfig;
  connectionType?: "direct" | "proxy";
  onNotification?: (notification: Notification) => void;
  onStdErrNotification?: (notification: Notification) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onPendingRequest?: (request: any, resolve: any, reject: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onElicitationRequest?: (request: any, resolve: any) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getRoots?: () => any[];
  defaultLoggingLevel?: LoggingLevel;
  serverImplementation?: Implementation;
  metadata?: Record<string, string>;
  onDisconnect: () => void;
}

export function useConnection({
  sseUrl,
  oauthClientId,
  oauthClientSecret,
  oauthScope,
  config,
  onNotification,
  onPendingRequest,
  onElicitationRequest,
  getRoots,
  defaultLoggingLevel,
  metadata = {},
  onDisconnect,
}: UseConnectionOptions) {
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("disconnected");
  const { toast } = useToast();
  const [serverCapabilities, setServerCapabilities] =
    useState<ServerCapabilities | null>(null);
  const [mcpClient, setMcpClient] = useState<Client | null>(null);
  const [requestHistory, setRequestHistory] = useState<
    { request: string; response?: string }[]
  >([]);
  const [completionsSupported, setCompletionsSupported] = useState(false);
  const [serverImplementation, setServerImplementation] =
    useState<Implementation | null>(null);

  useEffect(() => {
    if (!oauthClientId) {
      clearClientInformationFromSessionStorage({
        serverUrl: sseUrl,
        isPreregistered: true,
      });
      return;
    }

    const clientInformation: { client_id: string; client_secret?: string } = {
      client_id: oauthClientId,
    };

    if (oauthClientSecret) {
      clientInformation.client_secret = oauthClientSecret;
    }

    saveClientInformationToSessionStorage({
      serverUrl: sseUrl,
      clientInformation,
      isPreregistered: true,
    });
  }, [oauthClientId, oauthClientSecret, sseUrl]);

  useEffect(() => {
    if (!oauthScope) {
      clearScopeFromSessionStorage(sseUrl);
      return;
    }

    saveScopeToSessionStorage(sseUrl, oauthScope);
  }, [oauthScope, sseUrl]);

  const pushHistory = (request: object, response?: object) => {
    setRequestHistory((prev) => [
      ...prev,
      {
        request: JSON.stringify(request),
        response: response !== undefined ? JSON.stringify(response) : undefined,
      },
    ]);
  };

  const makeRequest = async <T extends AnySchema>(
    request: ClientRequest,
    schema: T,
    options?: RequestOptions & { suppressToast?: boolean },
  ): Promise<SchemaOutput<T>> => {
    if (!mcpClient) {
      throw new Error("MCP client not connected");
    }
    try {
      const abortController = new AbortController();

      // Add metadata to the request if available, but skip for tool calls
      // as they handle metadata merging separately
      const shouldAddGeneralMetadata =
        request.method !== "tools/call" && Object.keys(metadata).length > 0;
      const requestWithMetadata = shouldAddGeneralMetadata
        ? {
            ...request,
            params: {
              ...request.params,
              _meta: metadata,
            },
          }
        : request;

      // prepare MCP Client request options
      const mcpRequestOptions: RequestOptions = {
        signal: options?.signal ?? abortController.signal,
        resetTimeoutOnProgress:
          options?.resetTimeoutOnProgress ??
          resetRequestTimeoutOnProgress(config),
        timeout: options?.timeout ?? getMCPServerRequestTimeout(config),
        maxTotalTimeout:
          options?.maxTotalTimeout ??
          getMCPServerRequestMaxTotalTimeout(config),
      };

      // If progress notifications are enabled, add an onprogress hook to the MCP Client request options
      // This is required by SDK to reset the timeout on progress notifications
      if (mcpRequestOptions.resetTimeoutOnProgress) {
        mcpRequestOptions.onprogress = (params: Progress) => {
          // Add progress notification to `Server Notification` window in the UI
          if (onNotification) {
            onNotification({
              method: "notifications/progress",
              params,
            });
          }
        };
      }

      let response;
      try {
        response = await mcpClient.request(
          requestWithMetadata,
          schema,
          mcpRequestOptions,
        );

        pushHistory(requestWithMetadata, response);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        pushHistory(requestWithMetadata, { error: errorMessage });
        throw error;
      }

      return response;
    } catch (e: unknown) {
      if (!options?.suppressToast) {
        const errorString = (e as Error).message ?? String(e);
        toast({
          title: "Error",
          description: errorString,
          variant: "destructive",
        });
      }
      throw e;
    }
  };

  const handleCompletion = async (
    ref: ResourceTemplateReference | PromptReference,
    argName: string,
    value: string,
    context?: Record<string, string>,
    signal?: AbortSignal,
  ): Promise<string[]> => {
    if (!mcpClient || !completionsSupported) {
      return [];
    }

    const request: ClientRequest = {
      method: "completion/complete",
      params: {
        argument: {
          name: argName,
          value,
        },
        ref,
      },
    };

    if (context) {
      request["params"]["context"] = {
        arguments: context,
      };
    }

    try {
      const response = await makeRequest(request, CompleteResultSchema, {
        signal,
        suppressToast: true,
      });
      return response?.completion.values || [];
    } catch (e: unknown) {
      // Disable completions silently if the server doesn't support them.
      // See https://github.com/modelcontextprotocol/specification/discussions/122
      if (e instanceof McpError && e.code === ErrorCode.MethodNotFound) {
        setCompletionsSupported(false);
        return [];
      }

      // Unexpected errors - show toast and rethrow
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
      throw e;
    }
  };

  const sendNotification = async (notification: ClientNotification) => {
    if (!mcpClient) {
      const error = new Error("MCP client not connected");
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }

    try {
      await mcpClient.notification(notification);
      // Log successful notifications
      pushHistory(notification);
    } catch (e: unknown) {
      if (e instanceof McpError) {
        // Log MCP protocol errors
        pushHistory(notification, { error: e.message });
      }
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
      throw e;
    }
  };

  const is401Error = (error: unknown): boolean => {
    return (
      (error instanceof SseError && error.code === 401) ||
      (error instanceof StreamableHTTPError && error.code === 401) ||
      (error instanceof Error && error.message.includes("401")) ||
      (error instanceof Error && error.message.includes("Unauthorized")) ||
      (error instanceof Error &&
        error.message.includes("Missing Authorization header"))
    );
  };

  const isProxyAuthError = (error: unknown): boolean => {
    return (
      error instanceof Error &&
      error.message.includes("Authentication required. Use the session token")
    );
  };

  const handleAuthError = useCallback(
    async (error: unknown) => {
      if (is401Error(error)) {
        let scope = oauthScope?.trim();
        if (!scope) {
          // Only discover resource metadata when we need to discover scopes
          let resourceMetadata;
          try {
            resourceMetadata = await discoverOAuthProtectedResourceMetadata(
              new URL("/", sseUrl),
            );
          } catch {
            // Resource metadata is optional, continue without it
          }
          scope = await discoverScopes(sseUrl, resourceMetadata);
        }

        saveScopeToSessionStorage(sseUrl, scope);
        const serverAuthProvider = new InspectorOAuthClientProvider(sseUrl);

        const result = await auth(serverAuthProvider, {
          serverUrl: sseUrl,
          scope,
        });
        return result === "AUTHORIZED";
      }

      return false;
    },
    [oauthScope, sseUrl],
  );

  const connect = useCallback(
    async (
      client: Client,
      transport: Transport,
      _e?: unknown,
      retryCount: number = 0,
    ) => {
      // Only check proxy health for proxy connections

      let lastRequest = "";
      try {
        // Determine connection URL based on the connection type

        if (onNotification) {
          [
            CancelledNotificationSchema,
            LoggingMessageNotificationSchema,
            ResourceUpdatedNotificationSchema,
            ResourceListChangedNotificationSchema,
            ToolListChangedNotificationSchema,
            PromptListChangedNotificationSchema,
          ].forEach((notificationSchema) => {
            client?.setNotificationHandler(notificationSchema, onNotification);
          });
          if (client) {
            client.fallbackNotificationHandler = (
              notification: Notification,
            ): Promise<void> => {
              onNotification(notification);
              return Promise.resolve();
            };
          }
        }

        let capabilities;
        try {
          if (transport) {
            const protocolOnMessage = transport.onmessage;
            if (protocolOnMessage) {
              transport.onmessage = (message) => {
                const resolvedMessage = resolveRefsInMessage(message);
                protocolOnMessage(resolvedMessage);
              };
            }
          }

          capabilities = client?.getServerCapabilities();
          const serverInfo = client?.getServerVersion();
          setServerImplementation(serverInfo || null);
          const initializeRequest = {
            method: "initialize",
          };
          pushHistory(initializeRequest, {
            capabilities,
            serverInfo: client?.getServerVersion(),
            instructions: client?.getInstructions(),
          });
        } catch (error) {
          // Check if it's a proxy auth error
          if (isProxyAuthError(error)) {
            toast({
              title: "Proxy Authentication Required",
              description:
                "Please enter the session token from the proxy server console in the Configuration settings.",
              variant: "destructive",
            });
            setConnectionStatus("error");
            return;
          }

          const shouldRetry = await handleAuthError(error);
          if (shouldRetry) {
            return connect(client, transport, undefined, retryCount + 1);
          }
          if (is401Error(error)) {
            // Don't set error state if we're about to redirect for auth

            return;
          }
          throw error;
        }
        setServerCapabilities(capabilities ?? null);
        setCompletionsSupported(capabilities?.completions !== undefined);

        if (onPendingRequest) {
          client?.setRequestHandler(CreateMessageRequestSchema, (request) => {
            return new Promise((resolve, reject) => {
              onPendingRequest(request, resolve, reject);
            });
          });
        }

        if (getRoots) {
          client?.setRequestHandler(ListRootsRequestSchema, async () => {
            return { roots: getRoots() };
          });
        }

        if (capabilities?.logging && defaultLoggingLevel) {
          lastRequest = "logging/setLevel";
          await client?.setLoggingLevel(defaultLoggingLevel);
          pushHistory(
            {
              method: "logging/setLevel",
              params: {
                level: defaultLoggingLevel,
              },
            },
            {},
          );
          lastRequest = "";
        }

        if (onElicitationRequest) {
          client?.setRequestHandler(ElicitRequestSchema, async (request) => {
            return new Promise((resolve) => {
              onElicitationRequest(request, resolve);
            });
          });
        }

        setMcpClient(client);
        setConnectionStatus("connected");
      } catch (e) {
        if (
          lastRequest === "logging/setLevel" &&
          e instanceof McpError &&
          e.code === ErrorCode.MethodNotFound
        ) {
          toast({
            title: "Error",
            description: `Server declares logging capability but doesn't implement method: "${lastRequest}"`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Connection error",
            description: `Connection failed: "${e}"`,
            variant: "destructive",
          });
        }
        console.error(e);
        setConnectionStatus("error");
      }
    },
    [
      defaultLoggingLevel,
      getRoots,
      handleAuthError,
      onElicitationRequest,
      onNotification,
      onPendingRequest,
      toast,
    ],
  );

  const clearRequestHistory = useCallback(() => {
    setRequestHistory([]);
    setServerImplementation(null);
  }, []);

  const disconnect = useCallback(
    async (url: string) => {
      onDisconnect();
      const authProvider = new InspectorOAuthClientProvider(url);
      authProvider.clear();
      setMcpClient(null);
      setConnectionStatus("disconnected");
      setCompletionsSupported(false);
      setServerCapabilities(null);
      clearRequestHistory();
    },
    [clearRequestHistory, onDisconnect],
  );

  return {
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
    connect,
    disconnect,
  };
}
