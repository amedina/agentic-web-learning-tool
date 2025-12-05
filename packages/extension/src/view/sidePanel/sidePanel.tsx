/**
 * External dependencies
 */
import { AssistantRuntimeProvider } from '@assistant-ui/react';
import { lastAssistantMessageIsCompleteWithToolCalls } from 'ai';
import { useChatRuntime } from '@assistant-ui/react-ai-sdk';
import { useEffect, useState } from 'react';
/**
 * Internal dependencies
 */
import { ChatBotUI } from './components';
import { transportGenerator } from './transports';
import type { GeminiNanoChatTransport } from './transports/geminiNano';

const provider: 'ollama' | 'browser-ai' | 'anthropic' = 'ollama';
const model = 'qwen3:14b';

const SidePanel = () => {
	const [transport, _setTransport] = useState(
		transportGenerator(provider, model, {
			baseURL: 'https://ollama.gagan.pro/api',
		})
	);
	const runtime = useChatRuntime({
		transport,
		sendAutomaticallyWhen: (messages) =>
			lastAssistantMessageIsCompleteWithToolCalls(messages),
	});

	useEffect(() => {
		transport.setRuntime(runtime);
    if(provider !== 'browser-ai'){
      return;
    }
		(transport as GeminiNanoChatTransport).initializeSession();
	}, [runtime]);

	return (
		<AssistantRuntimeProvider runtime={runtime}>
			<ChatBotUI runtime={runtime} />
		</AssistantRuntimeProvider>
	);
};

export default SidePanel;
