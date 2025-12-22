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

export const transport = new ExtensionClientTransport({
	portName: CONNECTION_NAMES.MCP_HOST,
});

//MCP client instance that connects to the extension background script
export const client = new Client({
	name: 'Extension Sidepanel',
	version: '1.0.0',
});

const Provider = ({ children }: PropsWithChildren) => {
	const [agents, setAgents] = useState<AgentType[]>([]);
	const [selectedAgent, setSelectedAgent] = useState<AgentType>();
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
	}, [intitialSync]);

	const memoisedValue = useMemo(() => {
		return {
			state: {
				agents,
				selectedAgent,
			},
			actions: {
				setSelectedAgent,
			},
		};
	}, [agents, selectedAgent]);

	return (
		<Context.Provider value={memoisedValue}>
			{/* @ts-expect-error -- library is still in development and may have some version mismatches.*/}
			<McpClientProvider client={client} transport={transport} opts={{}}>
				{children}
			</McpClientProvider>
		</Context.Provider>
	);
};

export default Provider;
