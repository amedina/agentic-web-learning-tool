/**
 * Internal dependencies
 */
import { useChatRuntime } from '@assistant-ui/react-ai-sdk';
import { ChatBotUI } from './components';
import { CommandProvider, useModelProvider } from './providers';
import {
	AssistantRuntimeProvider,
	type AssistantRuntime,
} from '@assistant-ui/react';
import { lastAssistantMessageIsCompleteWithToolCalls } from 'ai';
import { useEffect, useRef } from 'react';

const SidePanel = () => {
	const { transport } = useModelProvider(({ state }) => ({
		transport: state.transport,
	}));

	const runtimeRef = useRef<AssistantRuntime | null>(null);

	runtimeRef.current = useChatRuntime({
		//@ts-expect-error -- transport will be initialised once available
		transport,
		sendAutomaticallyWhen: (messages) =>
			lastAssistantMessageIsCompleteWithToolCalls(messages),
	});

	useEffect(() => {
		(async () => {
			if (!runtimeRef.current) {
				return;
			}
			runtimeRef.current.thread.reset();
			transport?.setRuntime(runtimeRef.current);
		})();
	}, [transport]);

	return (
		<AssistantRuntimeProvider runtime={runtimeRef.current}>
			<CommandProvider>
				<ChatBotUI runtime={runtimeRef.current} />
			</CommandProvider>
		</AssistantRuntimeProvider>
	);
};

export default SidePanel;
