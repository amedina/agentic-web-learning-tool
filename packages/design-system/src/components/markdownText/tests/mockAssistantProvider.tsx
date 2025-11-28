// MockAssistantProvider.tsx
import { type ReactNode } from 'react';
import { AssistantRuntimeProvider, useLocalRuntime } from '@assistant-ui/react';

export const MockAssistantProvider = ({
	children,
	welcomeMessage = 'Hello! I am a mock assistant. How can I help you?',
}: {
	children: ReactNode;
	welcomeMessage?: string;
	responseDelay?: number;
}) => {
	const runtime = useLocalRuntime(
		{
			run: () =>
				Promise.resolve({
					content: [{ type: 'text', text: welcomeMessage }],
				}),
		},
		{
			initialMessages: [
				{
					id: 'welcome',
					role: 'assistant',
					content: [
						{
							type: 'text',
							text: welcomeMessage,
						},
					],
				},
			],
		}
	);

	return (
		<AssistantRuntimeProvider runtime={runtime}>
			{children}
		</AssistantRuntimeProvider>
	);
};
