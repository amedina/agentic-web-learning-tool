/**
 * External dependencies.
 */
import {
	type PropsWithChildren,
	useEffect,
	useState,
	useCallback,
	useMemo,
	useRef,
} from 'react';
import type { WebMCPTool } from '@google-awlt/design-system';
/**
 * Internal dependencies.
 */
import Context from './context';
import { tools } from '../../../../contentScript/tools';

const builtInWebMCPTools: WebMCPTool[] = tools.map((tool) => ({
	name: tool.name,
	namespace: 'built_in',
	description: tool.description,
	allowedDomains: tool.allowedDomains,
	inputSchema: tool.inputSchema,
	enabled: true,
	isBuiltIn: true,
}));

const Provider = ({ children }: PropsWithChildren) => {
	const [userTools, setUserTools] = useState<WebMCPTool[]>([]);
	const [builtInTools, setBuiltInTools] =
		useState<WebMCPTool[]>(builtInWebMCPTools);
	const initialFetchDone = useRef(false);

	const intitialSync = useCallback(async () => {
		chrome.storage.local.get(
			['userWebMCPTools', 'builtInWebMCPToolsState'],
			(result) => {
				if (
					result.userWebMCPTools &&
					Array.isArray(result.userWebMCPTools)
				) {
					setUserTools(result.userWebMCPTools as WebMCPTool[]);
				}

				if (result.builtInWebMCPToolsState) {
					const states = result.builtInWebMCPToolsState as Record<
						string,
						boolean
					>;
					setBuiltInTools((prev) =>
						prev.map((t) => ({
							...t,
							enabled:
								states[t.name] !== undefined
									? states[t.name]
									: true,
						}))
					);
				}
				initialFetchDone.current = true;
			}
		);
	}, []);

	const onLocalStorageChangedListener = useCallback(async () => {
		const {
			userWebMCPTools = [],
			builtInWebMCPToolsState = [],
		}: {
			userWebMCPTools: WebMCPTool[];
			builtInWebMCPToolsState: WebMCPTool[];
		} = await chrome.storage.sync.get([
			'userWebMCPTools',
			'builtInWebMCPToolsState',
		]);

		setUserTools(userWebMCPTools);
		setBuiltInTools(builtInWebMCPToolsState);
	}, []);

	useEffect(() => {
		intitialSync();
		chrome.storage.local.onChanged.addListener(
			onLocalStorageChangedListener
		);

		return () => {
			chrome.storage.local.onChanged.removeListener(
				onLocalStorageChangedListener
			);
		};
	}, [intitialSync, onLocalStorageChangedListener]);

	const saveUserTools = useCallback((tools: WebMCPTool[]) => {
		setUserTools(tools);
		chrome.storage.local.set({ userWebMCPTools: tools });
	}, []);

	const saveBuiltInState = useCallback((tools: WebMCPTool[]) => {
		setBuiltInTools(tools);
		const states = tools.reduce<Record<string, boolean>>(
			(acc, t) => ({ ...acc, [t.name]: t.enabled }),
			{}
		);
		chrome.storage.local.set({ builtInWebMCPToolsState: states });
	}, []);

	const memoisedValue = useMemo(() => {
		return {
			state: {
				userTools,
				builtInTools,
			},
			actions: {
				setUserTools,
				setBuiltInTools,
				saveUserTools,
				saveBuiltInState,
			},
		};
	}, [builtInTools, userTools, saveBuiltInState, saveUserTools]);

	return (
		<Context.Provider value={memoisedValue}>{children}</Context.Provider>
	);
};

export default Provider;
