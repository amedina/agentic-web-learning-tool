/**
 * External dependencies
 */
import {
	useState,
	useCallback,
	type PropsWithChildren,
	useMemo,
	useEffect,
	useRef,
} from 'react';
import { Client } from '@modelcontextprotocol/sdk/client';
import type { MCPConfig, MCPServerConfig } from '@google-awlt/common';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
/**
 * Internal dependencies
 */
import MCPContext, { type MCPProviderContextType } from './context';

const Provider = ({ children }: PropsWithChildren) => {
	// We use a functional update to ensure we always have a fresh Map
	const [serverConfigs, setServerConfigs] = useState<
		MCPProviderContextType['state']['serverConfigs']
	>({});

	const [toolList, setToolList] = useState<
		MCPProviderContextType['state']['toolList']
	>({});

	const initialFetch = useRef(false);

	const createClientAndListTools = useCallback(
		async (config: MCPServerConfig, serverName: string) => {
			try {
				if (!config.enabled || toolList[serverName]?.length > 0) {
					return;
				}

				const requestInit: RequestInit = {};

				if (config.authToken) {
					requestInit.headers = {
						Authorization: `Bearer ${config.authToken}`,
					};
				}

				const client = new Client({
					name: 'chrome-options-page-client',
					version: '1.0',
				});

				const transport = new StreamableHTTPClientTransport(
					new URL(config.url),
					{
						requestInit,
					}
				);

				await client.connect(transport);
				const toolsList = await client.listTools();

				setToolList((prev) => ({
					...prev,
					[serverName]: toolsList.tools,
				}));
			} catch (error) {
				//catch error
			}
		},
		[toolList]
	);

	const handleToggle = useCallback((serverName: string, value: boolean) => {
		setServerConfigs((prev) => {
			const newValue = structuredClone(prev);
			newValue[serverName] = {
				...newValue[serverName],
				enabled: value,
			};
			return newValue;
		});
	}, []);

	const addConfig = useCallback(
		async (config: MCPServerConfig, serverName: string) => {
			await createClientAndListTools(config, serverName);
			setServerConfigs((prev) => ({
				...prev,
				[serverName]: config,
			}));
		},
		[createClientAndListTools]
	);

	useEffect(() => {
		if (!initialFetch.current) {
			return;
		}

		chrome.storage.local.set(
			{
				mcpServers: serverConfigs,
			},
			() => {
				Object.keys(serverConfigs).map(async (serverName) => {
					await createClientAndListTools(
						serverConfigs[serverName],
						serverName
					);
				});
			}
		);
	}, [serverConfigs, createClientAndListTools]);

	const initialSync = useCallback(() => {
		chrome.storage.local.get(
			'mcpServers',
			async ({ mcpServers }: MCPConfig) => {
				await Promise.all(
					Object.keys(mcpServers ?? {}).map(async (serverName) => {
						if (!serverName) {
							return Promise.resolve();
						}
						await addConfig(mcpServers?.[serverName], serverName);
					})
				);
				initialFetch.current = true;
			}
		);
	}, [addConfig]);

	useEffect(() => {
		initialSync();
	}, [initialSync]);

	/**
	 * Action: Remove a Server Configuration
	 */
	const removeConfig = useCallback((serverName: string) => {
		setServerConfigs((prev) => {
			const newConfig = structuredClone(prev);
			delete newConfig[serverName];
			return newConfig;
		});
	}, []);

	/**
	 * Action: Validate the Config
	 * Checks for required fields and valid URL formats.
	 */
	const validateConfig = useCallback(
		(config: MCPServerConfig, serverName: string) => {
			const errors: string[] = [];

			if (!serverName || serverName.trim().length === 0) {
				errors.push('Server name is required.');
			}

			if (!config.authToken || config.authToken.trim().length === 0) {
				errors.push('authToken is required.');
			}

			if (!config.url) {
				errors.push('Server URL is required.');
			} else {
				try {
					new URL(config.url);
				} catch (_) {
					errors.push('Invalid URL format.');
				}
			}

			return {
				errors,
				isValid: errors.length === 0,
			};
		},
		[]
	);

	const value = useMemo(
		() => ({
			state: {
				serverConfigs,
				toolList,
			},
			actions: {
				addConfig,
				removeConfig,
				validateConfig,
				handleToggle,
			},
		}),
		[serverConfigs, toolList, addConfig, validateConfig, removeConfig]
	);

	return <MCPContext.Provider value={value}>{children}</MCPContext.Provider>;
};

export default Provider;
