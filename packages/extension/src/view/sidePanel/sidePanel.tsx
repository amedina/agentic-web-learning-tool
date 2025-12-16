/**
 * Internal dependencies
 */
import { useChatRuntime } from '@assistant-ui/react-ai-sdk';
import { ChatBotUI } from './components';
import { useModelProvider } from './providers';
import { AssistantRuntimeProvider } from '@assistant-ui/react';
import { lastAssistantMessageIsCompleteWithToolCalls } from 'ai';

const SidePanel = () => {
	const { transport } = useModelProvider(({ state }) => ({
		transport: state.transport,
	}));

	const runtime = useChatRuntime({
		//@ts-expect-error -- transport will be initialised once available
		transport,
		sendAutomaticallyWhen: (messages) =>
			lastAssistantMessageIsCompleteWithToolCalls(messages),
	});
	console.log(runtime.threads.switchToNewThread())
	return (
		<AssistantRuntimeProvider runtime={runtime}>
			<ChatBotUI runtime={runtime}/>
		</AssistantRuntimeProvider>
	);
};

export default SidePanel;
