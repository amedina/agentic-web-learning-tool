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
import type { AgentType } from '../../../../types';
import { DEFAULT_AGENTS } from '../../../../constants';

export const transport = new ExtensionClientTransport({
	portName: CONNECTION_NAMES.MCP_HOST,
});

//MCP client instance that connects to the extension background script
export const client = new Client({
	name: 'Extension Sidepanel',
	version: '1.0.0',
});

const Provider = ({ children }: PropsWithChildren) => {
	const [_agents, setAgents] = useState<AgentType[]>([]);
	const [selectedAgent, setSelectedAgent] = useState<AgentType>(
		DEFAULT_AGENTS[0]
	);
	const [_transport, setTransport] = useState<
		GeminiNanoChatTransport | CloudHostedTransport | null
	>(null);
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
						apiKey: selectedAgent?.apiKey,
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
		const { agents }: { agents: AgentType[] } =
			await chrome.storage.sync.get('agents');

		setAgents(agents);

		initialFetchDone.current = true;
	}, []);

	const onSyncStorageChangedListener = useCallback(async () => {
		const { agents }: { agents: AgentType[] } =
			await chrome.storage.sync.get('agents');

		setAgents(agents);
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
	}, [intitialSync]);

	const memoisedValue = useMemo(() => {
		return {
			state: {
				agents: _agents,
				selectedAgent,
				transport: _transport,
			},
			actions: {
				setSelectedAgent,
			},
		};
	}, [_agents, selectedAgent, _transport]);

	return (
		<Context.Provider value={memoisedValue}>
			<McpClientProvider client={client} transport={transport} opts={{}}>
				{children}
			</McpClientProvider>
		</Context.Provider>
	);
};

export default Provider;
