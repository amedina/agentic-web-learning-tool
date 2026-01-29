/**
 * External dependencies
 */
import { useState, useCallback } from "react";
import {
  Play,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  RotateCcw,
  Settings,
  HelpCircle,
  RefreshCwOff,
  Copy,
  CheckCheck,
  Server,
} from "lucide-react";
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tooltip,
} from "@google-awlt/design-system";

/**
 * Internal dependencies
 */
import type { InspectorConfig } from "../lib/configurationTypes";
import type { ConnectionStatus } from "../lib/constants";
import CustomHeaders from "./CustomHeaders";
import type { CustomHeaders as CustomHeadersType } from "../lib/types/customHeaders";
import { useToast } from "../lib/hooks/useToast";
import IconDisplay, { type WithIcons } from "./IconDisplay";

interface SidebarProps {
  connectionStatus: ConnectionStatus;
  transportType: "sse" | "streamable-http";
  setTransportType: (type: "sse" | "streamable-http") => void;
  sseUrl: string;
  setSseUrl: (url: string) => void;
  customHeaders: CustomHeadersType;
  setCustomHeaders: (headers: CustomHeadersType) => void;
  oauthClientId: string;
  setOauthClientId: (id: string) => void;
  oauthClientSecret: string;
  setOauthClientSecret: (secret: string) => void;
  oauthScope: string;
  setOauthScope: (scope: string) => void;
  onConnect: () => void;
  onDisconnect: () => void;
  config: InspectorConfig;
  setConfig: (config: InspectorConfig) => void;
  connectionType: "direct" | "proxy";
  setConnectionType: (type: "direct" | "proxy") => void;
  serverImplementation?:
    | (WithIcons & { name?: string; version?: string; websiteUrl?: string })
    | null;
}

const Sidebar = ({
  connectionStatus,
  transportType,
  setTransportType,
  sseUrl,
  setSseUrl,
  customHeaders,
  setCustomHeaders,
  oauthClientId,
  setOauthClientId,
  oauthClientSecret,
  setOauthClientSecret,
  oauthScope,
  setOauthScope,
  onConnect,
  onDisconnect,
  config,
  setConfig,
  connectionType,
  setConnectionType,
  serverImplementation,
}: SidebarProps) => {
  const [showAuthConfig, setShowAuthConfig] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showClientSecret, setShowClientSecret] = useState(false);

  const handleToggleAuthConfig = useCallback(() => {
    setShowAuthConfig((prev) => !prev);
  }, []);

  const handleToggleConfig = useCallback(() => {
    setShowConfig((prev) => !prev);
  }, []);

  const handleToggleClientSecret = useCallback(() => {
    setShowClientSecret((prev) => !prev);
  }, []);

  const handleRestartReconnect = useCallback(() => {
    onDisconnect();
    onConnect();
  }, [onDisconnect, onConnect]);

  const handleTransportTypeChange = useCallback(
    (value: "sse" | "streamable-http") => {
      setTransportType(value);
    },
    [setTransportType],
  );

  const handleSseUrlChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setSseUrl(e.target.value),
    [setSseUrl],
  );

  const handleConnectionTypeChange = useCallback(
    (value: "direct" | "proxy") => {
      setConnectionType(value);
    },
    [setConnectionType],
  );

  const handleOauthClientIdChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setOauthClientId(e.target.value),
    [setOauthClientId],
  );

  const handleOauthClientSecretChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setOauthClientSecret(e.target.value),
    [setOauthClientSecret],
  );

  const handleOauthScopeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setOauthScope(e.target.value),
    [setOauthScope],
  );

  return (
    <div className="bg-card border-r border-border flex flex-col h-full">
      <div className="p-4 flex-1 overflow-auto" style={{ paddingLeft: "1px" }}>
        <div className="space-y-4">
          <div className="space-y-2">
            <label
              className="text-sm font-medium"
              htmlFor="transport-type-select"
            >
              Transport Type
            </label>
            <Select
              value={transportType}
              onValueChange={handleTransportTypeChange}
            >
              <SelectTrigger id="transport-type-select">
                <SelectValue placeholder="Select transport type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sse">SSE</SelectItem>
                <SelectItem value="streamable-http">Streamable HTTP</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="sse-url-input">
              URL
            </label>
            {sseUrl ? (
              <Tooltip text={sseUrl}>
                <Input
                  id="sse-url-input"
                  placeholder="URL"
                  value={sseUrl}
                  onChange={handleSseUrlChange}
                  className="font-mono"
                />
              </Tooltip>
            ) : (
              <Input
                id="sse-url-input"
                placeholder="URL"
                value={sseUrl}
                onChange={handleSseUrlChange}
                className="font-mono"
              />
            )}
          </div>

          <Tooltip text={connectionTypeTip}>
            <div className="space-y-2">
              <label
                className="text-sm font-medium"
                htmlFor="connection-type-select"
              >
                Connection Type
              </label>
              <Select
                value={connectionType}
                onValueChange={handleConnectionTypeChange}
              >
                <SelectTrigger id="connection-type-select">
                  <SelectValue placeholder="Select connection type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="proxy">Via Proxy</SelectItem>
                  <SelectItem value="direct">Direct</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Tooltip>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <Tooltip text="Copy Server Entry">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyServerEntry}
                className="w-full"
              >
                {copiedServerEntry ? (
                  <CheckCheck className="h-4 w-4 mr-2" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                Server Entry
              </Button>
            </Tooltip>
            <Tooltip text="Copy Server File">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyServerFile}
                className="w-full"
              >
                {copiedServerFile ? (
                  <CheckCheck className="h-4 w-4 mr-2" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                Servers File
              </Button>
            </Tooltip>
          </div>

          <div className="space-y-2">
            <Button
              variant="outline"
              onClick={handleToggleAuthConfig}
              className="flex items-center w-full"
              data-testid="auth-button"
              aria-expanded={showAuthConfig}
            >
              {showAuthConfig ? (
                <ChevronDown className="w-4 h-4 mr-2" />
              ) : (
                <ChevronRight className="w-4 h-4 mr-2" />
              )}
              Authentication
            </Button>
            {showAuthConfig && (
              <>
                {/* Custom Headers Section */}
                <div className="p-3 rounded border overflow-hidden">
                  <CustomHeaders
                    headers={customHeaders}
                    onChange={setCustomHeaders}
                  />
                </div>
                <div className="space-y-2 p-3  rounded border">
                  <h4 className="text-sm font-semibold flex items-center">
                    OAuth 2.0 Flow
                  </h4>
                  <div className="space-y-2">
                    <label
                      htmlFor="oauth-client-id-input"
                      className="text-sm font-medium"
                    >
                      Client ID
                    </label>
                    <Input
                      id="oauth-client-id-input"
                      placeholder="Client ID"
                      onChange={handleOauthClientIdChange}
                      value={oauthClientId}
                      data-testid="oauth-client-id-input"
                      className="font-mono"
                    />
                    <label
                      htmlFor="oauth-client-secret-input"
                      className="text-sm font-medium"
                    >
                      Client Secret
                    </label>
                    <div className="flex gap-2">
                      <Input
                        id="oauth-client-secret-input"
                        type={showClientSecret ? "text" : "password"}
                        placeholder="Client Secret (optional)"
                        onChange={handleOauthClientSecretChange}
                        value={oauthClientSecret}
                        data-testid="oauth-client-secret-input"
                        className="font-mono"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 p-0 shrink-0"
                        onClick={handleToggleClientSecret}
                        aria-label={
                          showClientSecret ? "Hide secret" : "Show secret"
                        }
                        aria-pressed={showClientSecret}
                        title={showClientSecret ? "Hide secret" : "Show secret"}
                      >
                        {showClientSecret ? (
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <EyeOff className="h-4 w-4" aria-hidden="true" />
                        )}
                      </Button>
                    </div>
                    <label
                      htmlFor="oauth-scope"
                      className="text-sm font-medium"
                    >
                      Redirect URL
                    </label>
                    <Input
                      readOnly
                      placeholder="Redirect URL"
                      value={window.location.origin + "/oauth/callback"}
                      className="font-mono"
                    />
                    <label
                      htmlFor="oauth-scope-input"
                      className="text-sm font-medium"
                    >
                      Scope
                    </label>
                    <Input
                      placeholder="Scope (space-separated)"
                      onChange={handleOauthScopeChange}
                      value={oauthScope}
                      id="oauth-scope-input"
                      data-testid="oauth-scope-input"
                      className="font-mono"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
          {/* Configuration */}
          <div className="space-y-2">
            <Button
              variant="outline"
              onClick={handleToggleConfig}
              className="flex items-center w-full"
              data-testid="config-button"
              aria-expanded={showConfig}
            >
              {showConfig ? (
                <ChevronDown className="w-4 h-4 mr-2" />
              ) : (
                <ChevronRight className="w-4 h-4 mr-2" />
              )}
              <Settings className="w-4 h-4 mr-2" />
              Configuration
            </Button>
            {showConfig && (
              <div className="space-y-2">
                {Object.entries(config).map(([key, configItem]) => {
                  const configKey = key as keyof InspectorConfig;
                  return (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center gap-1">
                        <label
                          className="text-sm font-medium text-green-600 break-all"
                          htmlFor={`${configKey}-input`}
                        >
                          {configItem.label}
                        </label>
                        <Tooltip text={configItem.description}>
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </Tooltip>
                      </div>
                      {typeof configItem.value === "number" ? (
                        <Input
                          id={`${configKey}-input`}
                          type="number"
                          data-testid={`${configKey}-input`}
                          value={configItem.value}
                          onChange={(e) =>
                            handleConfigNumberChange(
                              configKey,
                              configItem,
                              e.target.value,
                            )
                          }
                          className="font-mono"
                        />
                      ) : typeof configItem.value === "boolean" ? (
                        <Select
                          data-testid={`${configKey}-select`}
                          value={configItem.value.toString()}
                          onValueChange={(val) =>
                            handleConfigBooleanChange(
                              configKey,
                              configItem,
                              val,
                            )
                          }
                        >
                          <SelectTrigger id={`${configKey}-input`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">True</SelectItem>
                            <SelectItem value="false">False</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id={`${configKey}-input`}
                          data-testid={`${configKey}-input`}
                          value={configItem.value}
                          onChange={(e) =>
                            handleConfigStringChange(
                              configKey,
                              configItem,
                              e.target.value,
                            )
                          }
                          className="font-mono"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-2">
            {connectionStatus === "connected" && (
              <div className="grid grid-cols-2 gap-4">
                <Button
                  data-testid="connect-button"
                  onClick={handleRestartReconnect}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reconnect
                </Button>
                <Button onClick={onDisconnect}>
                  <RefreshCwOff className="w-4 h-4 mr-2" />
                  Disconnect
                </Button>
              </div>
            )}
            {connectionStatus !== "connected" && (
              <Button className="w-full" onClick={onConnect}>
                <Play className="w-4 h-4 mr-2" />
                Connect
              </Button>
            )}

            <div className="flex items-center justify-center space-x-2 mb-4">
              <div
                className={`w-2 h-2 rounded-full ${(() => {
                  switch (connectionStatus) {
                    case "connected":
                      return "bg-green-500";
                    case "error":
                      return "bg-red-500";
                    case "error-connecting-to-proxy":
                      return "bg-red-500";
                    default:
                      return "bg-gray-500";
                  }
                })()}`}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {(() => {
                  switch (connectionStatus) {
                    case "connected":
                      return "Connected";
                    case "error": {
                      const hasProxyToken = config.MCP_PROXY_AUTH_TOKEN?.value;
                      if (!hasProxyToken) {
                        return "Connection Error - Did you add the proxy session token in Configuration?";
                      }
                      return "Connection Error - Check if your MCP server is running and proxy token is correct";
                    }
                    case "error-connecting-to-proxy":
                      return "Error Connecting to MCP Inspector Proxy - Check Console logs";
                    default:
                      return "Disconnected";
                  }
                })()}
              </span>
            </div>

            {connectionStatus === "connected" && serverImplementation && (
              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg mb-4">
                <div className="flex items-center gap-2 mb-1">
                  {(serverImplementation as WithIcons).icons &&
                  (serverImplementation as WithIcons).icons!.length > 0 ? (
                    <IconDisplay
                      icons={(serverImplementation as WithIcons).icons}
                      size="sm"
                    />
                  ) : (
                    <Server className="w-4 h-4 text-gray-500" />
                  )}
                  {(serverImplementation as { websiteUrl?: string })
                    .websiteUrl ? (
                    <a
                      href={
                        (serverImplementation as { websiteUrl?: string })
                          .websiteUrl
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-colors"
                    >
                      {serverImplementation.name || "MCP Server"}
                    </a>
                  ) : (
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {serverImplementation.name || "MCP Server"}
                    </span>
                  )}
                </div>
                {serverImplementation.version && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Version: {serverImplementation.version}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
