/**
 * External dependencies.
 */
import { useChatRuntime } from '@assistant-ui/react-ai-sdk';
import { lastAssistantMessageIsCompleteWithToolCalls } from 'ai';
import {
	type PropsWithChildren,
	useEffect,
	useState,
	useCallback,
	useRef,
	useMemo,
} from 'react';
import {
	AssistantRuntimeProvider,
	type AssistantRuntime,
} from '@assistant-ui/react';
import { McpClientProvider } from '@mcp-b/mcp-react-hooks';
import { ExtensionClientTransport } from '@mcp-b/transports';
import { Client } from '@modelcontextprotocol/sdk/client';

/**
 * Internal dependencies.
 */
import { transportGenerator } from '../../transports';
import type { CloudHostedTrapsort } from '../../transports/cloudHosted';
import { GeminiNanoChatTransport } from '../../transports/geminiNano';
import Context from './context';
import { CONNECTION_NAMES } from '../../../../utils';

export const transport = new ExtensionClientTransport({
	portName: CONNECTION_NAMES.MCP_HOST,
});

//MCP client instance that connects to the extension background script
export const client = new Client({
	name: 'Extension Sidepanel',
	version: '1.0.0',
});

const Provider = ({ children }: PropsWithChildren) => {
	const [_modelProvider, setModelProvider] = useState<string>('');
	const [_llmModel, setLLMModel] = useState<string>('');
	const [_modelConfig, setModelConfig] = useState<Record<string, string>>({});
	const [_transport, setTransport] = useState<
		GeminiNanoChatTransport | CloudHostedTrapsort
	>(new GeminiNanoChatTransport());
	const runtimeRef = useRef<AssistantRuntime | null>(null);
	const initialFetchDone = useRef<boolean>(false);

	useEffect(() => {
		chrome.storage.sync.set({
			modelProvider: _modelProvider,
			llmModel: _llmModel,
			modelConfig: _modelConfig,
		});
	}, [_llmModel, _modelProvider, _modelConfig]);

	/**
	 * Sets current frames for sidebar, detected if the current tab is to be analysed,
	 * parses data currently in store, set current tab URL.
	 */
	const intitialSync = useCallback(async () => {
		const { modelProvider, llmModel, modelConfig } =
			await chrome.storage.sync.get([
				'modelProvider',
				'llmModel',
				'modelConfig',
			]);

		setModelConfig(modelConfig);
		setModelProvider(modelProvider);
		setLLMModel(llmModel);

		if (modelProvider && llmModel && modelConfig) {
			setTransport(transportGenerator(modelProvider, llmModel, {}));
		}

		initialFetchDone.current = true;
	}, []);

	runtimeRef.current = useChatRuntime({
		transport: _transport,
		sendAutomaticallyWhen: (messages) =>
			lastAssistantMessageIsCompleteWithToolCalls(messages),
	});

	useEffect(() => {
		if (!_transport || !runtimeRef.current || !initialFetchDone.current) {
			return;
		}

		if (_modelProvider !== 'browser-ai') {
			return;
		}

		(_transport as GeminiNanoChatTransport).initializeSession();
	}, [_modelProvider, _transport]);

	useEffect(() => {
		intitialSync();
	}, [intitialSync]);

	const setModelAndConfig = useCallback(
		(selectedModel: string, selectedProvider: string) => {
			setModelProvider(selectedProvider);
			setLLMModel(selectedModel);
		},
		[]
	);

	const memoisedValue = useMemo(() => {
		return {
			state: {
				selectedProvider: _modelProvider,
				selectedModel: _llmModel,
				runtime: runtimeRef.current,
			},
			actions: {
				setSelectedModel: setModelAndConfig,
			},
		};
	}, [_modelProvider, _llmModel, setModelAndConfig]);

	return (
		<Context.Provider value={memoisedValue}>
			{/*@ts-expect-error -- library is still in development and may have some version mismatches.*/}
			<McpClientProvider client={client} transport={transport} opts={{}}>
				<AssistantRuntimeProvider runtime={runtimeRef.current}>
					{children}
				</AssistantRuntimeProvider>
			</McpClientProvider>
		</Context.Provider>
	);
};

export default Provider;
