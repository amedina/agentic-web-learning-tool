/**
 * External dependencies
 */
import {
	ComposerPrimitive,
	ThreadPrimitive,
	useAssistantState,
	type AssistantRuntime,
} from '@assistant-ui/react';
import { useMcpClient } from '@mcp-b/mcp-react-hooks';
import { useEffect } from 'react';
import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';
import {
	Bot,
	Paperclip,
	SendHorizontal,
	CircleStop,
} from 'lucide-react';
/**
 * Internal dependencies
 */
import { useAssistantMCP } from '../../hooks';
import { transport } from '../../providers';
import ModelSelectorDropDown from '../modelSelectorDropDown';
import AssistantMessage from './assistantMessage';
import EditComposer from './editComposer';
import UserMessage from './userMessage';



type ChatBotUIProps = {
	runtime: AssistantRuntime;
};

const ChatBotUI = ({ runtime }: ChatBotUIProps) => {
	const { client, tools } = useMcpClient();

	useEffect(() => {
		(async () => {
			await client.connect(transport);
		})();

		return () => {
			client.close();
		};
	}, [client]);

	useEffect(() => {
		transport.onmessage = async (message: JSONRPCMessage) => {
			if ('method' in message && message.method === 'get/Tools') {
				await client.listTools();
			}
		};
	}, [client]);

	const threadId = useAssistantState(
		({ threadListItem }) => threadListItem.id
	);
	useAssistantMCP(tools, client, threadId, runtime, {});

	return (
		<ThreadPrimitive.Root className="h-full flex flex-col">
			<ThreadPrimitive.Viewport className="flex-1 overflow-y-auto scroll-smooth px-4 md:px-0">
				<div className="max-w-3xl mx-auto w-full pt-8 pb-32">
					{/* Empty State / Welcome */}
					<ThreadPrimitive.Empty>
						<div className="flex flex-col items-center justify-center text-center mt-20 px-4">
							<div className="h-16 w-16 rounded-2xl flex items-center justify-center bg-background shadow-lg mb-6 text-foreground">
								<Bot size={32} />
							</div>
							<h2 className="text-2xl font-bold text-zinc-900 mb-2">
								How can I help you today?
							</h2>
							<p className="text-zinc-500 max-w-md mb-8">
								I can help you write code, analyze data, or even
								check the weather. I have access to{' '}
								{tools.length} tools.
							</p>
						</div>
					</ThreadPrimitive.Empty>

					{/* Messages */}
					<ThreadPrimitive.Messages
						components={{
							UserMessage,
							EditComposer,
							AssistantMessage,
						}}
					/>
				</div>
			</ThreadPrimitive.Viewport>
			<div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pb-6 pt-10 px-4">
				<div className="max-w-3xl mx-auto w-full">
					<ComposerPrimitive.Root className="relative flex flex-col gap-2 rounded-2xl border border-zinc-200 bg-white shadow-xl shadow-zinc-200/50 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all overflow-hidden">
						<ComposerPrimitive.Input
							placeholder="Ask anything..."
							className="w-full max-h-40 min-h-[56px] resize-none bg-transparent px-4 py-4 text-base outline-none placeholder:text-zinc-400 text-zinc-800"
						/>
						<div className="flex items-center justify-between px-3 pb-3">
							<div className="flex items-center gap-1">
								<button
									className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
									title="Attach"
								>
									<Paperclip size={18} />
								</button>
								<ModelSelectorDropDown />
							</div>
							<ThreadPrimitive.If running={false}>
								<ComposerPrimitive.Send className="h-9 w-9 flex items-center justify-center rounded-lg bg-background hover:text-ring text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
									<SendHorizontal size={18} />
								</ComposerPrimitive.Send>
							</ThreadPrimitive.If>
							<ThreadPrimitive.If running>
								<ComposerPrimitive.Cancel className="h-9 w-9 flex items-center justify-center rounded-lg bg-background hover:text-ring text-foreground hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
									<CircleStop size={18} />
								</ComposerPrimitive.Cancel>
							</ThreadPrimitive.If>
						</div>
					</ComposerPrimitive.Root>
					<div className="text-center mt-3 text-xs text-zinc-400">
						AI can make mistakes. Please verify important
						information.
					</div>
				</div>
			</div>
		</ThreadPrimitive.Root>
	);
};

export default ChatBotUI;
