/**
 * External dependencies.
 */
import {
	type PropsWithChildren,
	useEffect,
	useState,
	useCallback,
	useRef,
	useMemo,
} from 'react';
import { McpClientProvider } from '@mcp-b/mcp-react-hooks';
import { ExtensionClientTransport } from '@mcp-b/transports';
import { Client } from '@modelcontextprotocol/sdk/client';

/**
 * Internal dependencies.
 */
import { transportGenerator } from '../../transports';
import type { CloudHostedTransport } from '../../transports/cloudHosted';
import { GeminiNanoChatTransport } from '../../transports/geminiNano';
import Context from './context';
import { CONNECTION_NAMES } from '../../../../utils';
import type { AgentType, APIKeys } from '../../../../types';

export const transport = new ExtensionClientTransport({
	portName: CONNECTION_NAMES.MCP_HOST,
});

//MCP client instance that connects to the extension background script
export const client = new Client({
	name: 'Extension Sidepanel',
	version: '1.0.0',
});

const FALLBACK_AGENT = transportGenerator('browser-ai', 'prompt-api', {})

const Provider = ({ children }: PropsWithChildren) => {
	const [apiKeys, setApiKeys] = useState<{[key:string]: APIKeys}>({});
	const [selectedAgent, setSelectedAgent] = useState<AgentType>({
		modelProvider: 'browser-ai',
		model: 'prompt-api'
	});

	const [_transport, setTransport] = useState<
		GeminiNanoChatTransport | CloudHostedTransport | null
	>(FALLBACK_AGENT);
	const initialFetchDone = useRef<boolean>(false);

	useEffect(() => {
		if (!initialFetchDone.current) {
			return;
		}

		if (selectedAgent) {
			setTransport(
				transportGenerator(
					selectedAgent?.modelProvider,
					selectedAgent?.model,
					{
						...apiKeys[selectedAgent?.modelProvider],
					}
				)
			);
		} else {
			setTransport(transportGenerator('browser-ai', 'prompt-api', {}));
		}
	}, [selectedAgent]);

	/**
	 * Sets current frames for sidebar, detected if the current tab is to be analysed,
	 * parses data currently in store, set current tab URL.
	 */
	const intitialSync = useCallback(async () => {
		const { apiKeys = {} }: { apiKeys: {[key:string]: APIKeys} } =
			await chrome.storage.sync.get('apiKeys');

		setApiKeys(apiKeys);
		(FALLBACK_AGENT as GeminiNanoChatTransport).initializeSession();
		initialFetchDone.current = true;
	}, []);

	const onSyncStorageChangedListener = useCallback(async () => {
		const { apiKeys = {} }: { apiKeys: {[key:string]: APIKeys} } =
			await chrome.storage.sync.get('apiKeys');

		setApiKeys(apiKeys);
	}, []);

	useEffect(() => {
		if (!_transport || !initialFetchDone.current) {
			return;
		}

		if (selectedAgent?.modelProvider !== 'browser-ai') {
			return;
		}

		(_transport as GeminiNanoChatTransport).initializeSession();
	}, [selectedAgent?.modelProvider, _transport]);

	useEffect(() => {
		intitialSync();
		chrome.storage.sync.onChanged.addListener(onSyncStorageChangedListener);
		return () => {
			chrome.storage.sync.onChanged.removeListener(
				onSyncStorageChangedListener
			);
		};
	}, [intitialSync, onSyncStorageChangedListener]);

	const memoisedValue = useMemo(() => {
		return {
			state: {
				apiKeys,
				selectedAgent,
				transport: _transport,
			},
			actions: {
				setSelectedAgent,
			},
		};
	}, [apiKeys, selectedAgent, _transport]);

	return (
		<Context.Provider value={memoisedValue}>
			<McpClientProvider client={client} transport={transport} opts={{}}>
				{children}
			</McpClientProvider>
		</Context.Provider>
	);
};

export default Provider;
