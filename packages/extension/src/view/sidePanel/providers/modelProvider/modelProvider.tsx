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
		GeminiNanoChatTransport | CloudHostedTransport | null
	>(null);
	const initialFetchDone = useRef<boolean>(false);
	const [_baseUrl, setBaseUrl] = useState<string>('');
	const [_apiKey, setApiKey] = useState<string>('');

	useEffect(() => {
		if (!initialFetchDone.current) {
			return;
		}

		chrome.storage.sync.set({
			modelProvider: _modelProvider,
			llmModel: _llmModel,
			modelConfig: _modelConfig,
			apiKey: _apiKey,
			baseUrl: _baseUrl,
		});
	}, [_llmModel, _modelProvider, _modelConfig, _baseUrl, _apiKey]);

	useEffect(() => {
		if (!initialFetchDone.current) {
			return
		}

		if (_apiKey) {
			setTransport(
				transportGenerator(_modelProvider, _llmModel, {
					apiKey: _apiKey,
				})
			);
		} else {
			setTransport(transportGenerator('browser-ai', 'prompt-api', {}));
		}
	}, [_llmModel, _modelProvider, _modelConfig, _apiKey]);

	const handleCustomConfig = useCallback(
		(baseUrl: string, customConfig: Record<string, any>) => {
			setBaseUrl(baseUrl);
			setModelConfig(customConfig);
		},
		[]
	);

	/**
	 * Sets current frames for sidebar, detected if the current tab is to be analysed,
	 * parses data currently in store, set current tab URL.
	 */
	const intitialSync = useCallback(async () => {
		const items = await chrome.storage.sync.get([
			'modelProvider',
			'llmModel',
			'modelConfig',
			'apiKey',
			'baseUrl',
		]);

		const modelProvider = items.modelProvider as string | undefined;
		const llmModel = items.llmModel as string | undefined;
		const modelConfig = items.modelConfig as
			| Record<string, string>
			| undefined;
		const apiKey = items.apiKey as string | undefined;
		const baseUrl = items.baseUrl as string | undefined;

		if (baseUrl && !modelConfig) {
			setModelConfig({});
			setBaseUrl(baseUrl);
			initialFetchDone.current = true;
		}

		if (!modelProvider || !llmModel || !apiKey) {
			setModelProvider(modelProvider || '');
			setLLMModel(llmModel || '');
			setApiKey(apiKey || '');
			initialFetchDone.current = true;
			return;
		}

		setModelConfig(modelConfig || {});
		setModelProvider(modelProvider);
		setLLMModel(llmModel);
		setApiKey(apiKey);

		initialFetchDone.current = true;
	}, []);

	useEffect(() => {
		if (!_transport || !initialFetchDone.current) {
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
				transport: _transport,
				baseUrl: _baseUrl,
				apiKey: _apiKey,
			},
			actions: {
				setSelectedModel: setModelAndConfig,
				handleCustomConfig,
				setApiKey,
			},
		};
	}, [
		_modelProvider,
		_llmModel,
		setModelAndConfig,
		handleCustomConfig,
		_baseUrl,
		_apiKey,
		_transport,
	]);

	return (
		<Context.Provider value={memoisedValue}>
			{/* @ts-ignore -- library is still in development and may have some version mismatches.*/}
			<McpClientProvider client={client} transport={transport} opts={{}}>
				{children}
			</McpClientProvider>
		</Context.Provider>
	);
};

export default Provider;
