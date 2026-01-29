/**
 * External dependencies.
 */
import {
  CheckCheck,
  ChevronDown,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  HelpCircle,
  Settings,
} from 'lucide-react';
import type {
  CustomHeaders as CustomHeadersType,
  InspectorConfig,
  MCPServerConfig,
} from '@google-awlt/common';

/**
 * Internal dependencies.
 */
import Input from '../input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../select';
import { Tooltip } from '../tooltip';
import { Button } from '../button';
import { useCallback, useState } from 'react';
import { toast } from '../toast';
import CustomHeaders from './CustomHeaders';

interface MCPServerConfigInput {
  config: MCPServerConfig;
  setConfig: (key: string, value: any) => void;
}

export function ConfigInput({ config, setConfig }: MCPServerConfigInput) {
  const [copiedServerEntry, setCopiedServerEntry] = useState(false);
  const [showAuthConfig, setShowAuthConfig] = useState(false);
  const [copiedServerFile, setCopiedServerFile] = useState(false);
  const [showClientSecret, setShowClientSecret] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  const handleConfigNumberChange = useCallback(
    (
      configKey: keyof InspectorConfig,
      configItem: InspectorConfig[keyof InspectorConfig],
      value: string
    ) => {
      const newConfig = { ...config.inspectorConfig };
      newConfig[configKey] = {
        ...configItem,
        value: Number(value),
      };
      setConfig('inspectorConfig', newConfig);
    },
    [config.inspectorConfig, setConfig]
  );

  const handleConfigBooleanChange = useCallback(
    (
      configKey: keyof InspectorConfig,
      configItem: InspectorConfig[keyof InspectorConfig],
      value: string
    ) => {
      const newConfig = { ...config.inspectorConfig };
      newConfig[configKey] = {
        ...configItem,
        value: value === 'true',
      };
      setConfig('inspectorConfig', newConfig);
    },
    [config.inspectorConfig, setConfig]
  );

  const handleConfigStringChange = useCallback(
    (
      configKey: keyof InspectorConfig,
      configItem: InspectorConfig[keyof InspectorConfig],
      value: string
    ) => {
      const newConfig = { ...config.inspectorConfig };
      newConfig[configKey] = {
        ...configItem,
        value: value,
      };
      setConfig('inspectorConfig', newConfig);
    },
    [config.inspectorConfig, setConfig]
  );

  // Shared utility function to generate server config
  const generateServerConfig = useCallback(() => {
    if (config.transport === 'sse') {
      return {
        type: 'sse',
        url: config.url,
        note: 'For SSE connections, add this URL directly in your MCP Client',
      };
    }
    if (config.transport === 'streamable-http') {
      return {
        type: 'streamable-http',
        url: config.url,
        note: 'For Streamable HTTP connections, add this URL directly in your MCP Client',
      };
    }
    return {};
  }, [config.transport, config.url]);

  // Memoized config entry generator
  const generateMCPServerEntry = useCallback(() => {
    return JSON.stringify(generateServerConfig(), null, 4);
  }, [generateServerConfig]);

  // Memoized config file generator
  const generateMCPServerFile = useCallback(() => {
    return JSON.stringify(
      {
        mcpServers: {
          'default-server': generateServerConfig(),
        },
      },
      null,
      4
    );
  }, [generateServerConfig]);

  const handleCopyServerEntry = useCallback(() => {
    try {
      const configJson = generateMCPServerEntry();
      navigator.clipboard
        .writeText(configJson)
        .then(() => {
          setCopiedServerEntry(true);

          toast.success('Config entry copied', {
            description:
              config.transport === 'streamable-http'
                ? 'Streamable HTTP URL has been copied. Use this URL directly in your MCP Client.'
                : 'SSE URL has been copied. Use this URL directly in your MCP Client.',
          });

          setTimeout(() => {
            setCopiedServerEntry(false);
          }, 2000);
        })
        .catch((error) => {
          reportError(error);
        });
    } catch (error) {
      reportError(error);
    }
  }, [generateMCPServerEntry, config.transport, toast, reportError]);

  const handleCopyServerFile = useCallback(() => {
    try {
      const configJson = generateMCPServerFile();
      navigator.clipboard
        .writeText(configJson)
        .then(() => {
          setCopiedServerFile(true);

          toast.success('Servers file copied', {
            description:
              "Servers configuration has been copied to clipboard. Add this to your mcp.json file. Current testing server will be added as 'default-server'",
          });

          setTimeout(() => {
            setCopiedServerFile(false);
          }, 2000);
        })
        .catch((error) => {
          reportError(error);
        });
    } catch (error) {
      reportError(error);
    }
  }, [generateMCPServerFile, toast, reportError]);
  return (
    <div className="bg-card border-r border-border flex flex-col h-full">
      <div className="p-4 flex-1 overflow-auto" style={{ paddingLeft: '1px' }}>
        <div className="space-y-4">
          <div className="space-y-2">
            <label
              className="text-sm font-medium"
              htmlFor="transport-type-select"
            >
              Transport Type
            </label>
            <Select
              value={config.transport}
              onValueChange={(value) => setConfig('transport', value)}
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
            {config.url ? (
              <Tooltip text={config.url}>
                <Input
                  id="sse-url-input"
                  placeholder="URL"
                  value={config.url}
                  onChange={(e) => setConfig('url', e.target.value)}
                  className="font-mono"
                />
              </Tooltip>
            ) : (
              <Input
                id="sse-url-input"
                placeholder="URL"
                value={config.url}
                onChange={(e) => setConfig('url', e.target.value)}
                className="font-mono"
              />
            )}
          </div>

          <Tooltip text="Connect to server directly (requires CORS config on server) or via MCP Inspector Proxy">
            <div className="space-y-2">
              <label
                className="text-sm font-medium"
                htmlFor="connection-type-select"
              >
                Connection Type
              </label>
              <Select
                value={config.connectionType}
                onValueChange={(value) => setConfig('connectionType', value)}
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
              onClick={() => setShowAuthConfig((prev) => !prev)}
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
                    headers={config.customHeaders as CustomHeadersType}
                    onChange={(headers) => setConfig('customHeaders', headers)}
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
                      onChange={(e) =>
                        setConfig('oauthClientId', e.target.value)
                      }
                      value={config.oauthClientId}
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
                        type={showClientSecret ? 'text' : 'password'}
                        placeholder="Client Secret (optional)"
                        onChange={(e) =>
                          setConfig('oauthClientSecret', e.target.value)
                        }
                        value={config.oauthClientSecret}
                        data-testid="oauth-client-secret-input"
                        className="font-mono"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 p-0 shrink-0"
                        onClick={() => setShowClientSecret((prev) => !prev)}
                        aria-label={
                          showClientSecret ? 'Hide secret' : 'Show secret'
                        }
                        aria-pressed={showClientSecret}
                        title={showClientSecret ? 'Hide secret' : 'Show secret'}
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
                      value={window.location.origin + '/oauth/callback'}
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
                      onChange={(e) => setConfig('oauthScope', e.target.value)}
                      value={config.oauthScope}
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
              onClick={() => setShowConfig((prev) => !prev)}
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
                      {typeof configItem.value === 'number' ? (
                        <Input
                          id={`${configKey}-input`}
                          type="number"
                          data-testid={`${configKey}-input`}
                          value={configItem.value}
                          onChange={(e) =>
                            handleConfigNumberChange(
                              configKey,
                              configItem,
                              e.target.value
                            )
                          }
                          className="font-mono"
                        />
                      ) : typeof configItem.value === 'boolean' ? (
                        <Select
                          data-testid={`${configKey}-select`}
                          value={configItem.value.toString()}
                          onValueChange={(val) =>
                            handleConfigBooleanChange(
                              configKey,
                              configItem,
                              val
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
                              e.target.value
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
        </div>
      </div>
    </div>
  );
}
