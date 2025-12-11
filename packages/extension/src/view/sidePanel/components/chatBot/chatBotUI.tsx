/**
 * External dependencies
 */
import {
	ComposerPrimitive,
	ThreadPrimitive,
	useAssistantState,
	type AssistantRuntime,
} from '@assistant-ui/react';
import { ArrowUpIcon, StopIcon } from '@radix-ui/react-icons';
import { useMcpClient } from '@mcp-b/mcp-react-hooks';
import { useEffect } from 'react';
import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';
/**
 * Internal dependencies
 */
import { useAssistantMCP } from '../../hooks';
import ChatMessage from './chatMessage';
import { transport } from '../../../../utils/transports';

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
	}
	}, [client]);

	useEffect(() => {
		transport.onmessage = (async(message: JSONRPCMessage) => {
			//@ts-expect-error -- One of the JSONRPCMessage doesnt have the method property
			if(message.method === 'get/Tools'){
				await client.listTools();
			}
		})
	}, [client]);

	const threadId = useAssistantState(
		({ threadListItem }) => threadListItem.id
	);
	//@ts-expect-error -- Mismatch in versions being used by library
	useAssistantMCP(tools, client, threadId, runtime);

	return (
		<ThreadPrimitive.Root className="flex h-full flex-col items-stretch bg-[#2b2a27] px-4 pt-16 font-serif">
			<ThreadPrimitive.Viewport className="no-scrollbar flex flex-grow flex-col overflow-y-scroll">
				<ThreadPrimitive.Messages
					components={{ Message: ChatMessage }}
				/>
				<ThreadPrimitive.If empty={false}>
					<p className="mx-auto w-full max-w-screen-md p-2 text-right text-xs text-[#b8b5a9]">
						LLM can make mistakes. Please double-check responses.
					</p>
				</ThreadPrimitive.If>
			</ThreadPrimitive.Viewport>

			<ComposerPrimitive.Root className="mx-auto relative flex w-full max-w-screen-md flex-col rounded-xl border border-[#6c6a6040] bg-[#393937] p-1.5 m-2">
				<div className="flex">
					<p className='absolute text-xxs top-0 left-0 ml-1 text-white'>Total tools registered: {tools.length}</p>
					<ComposerPrimitive.Input
						placeholder="Reply to Agent..."
						className="h-12 flex-grow resize-none bg-transparent p-3.5 text-sm text-white outline-none placeholder:text-white/50"
					/>
					<ThreadPrimitive.If running={false}>
						<ComposerPrimitive.Send
							type="submit"
							className="m-2 flex h-8 w-8 items-center justify-center rounded-lg bg-[#ae5630] text-2xl font-bold disabled:opacity-0"
						>
							<ArrowUpIcon
								width={16}
								height={16}
								className="text-[#ddd] [&_path]:stroke-white [&_path]:stroke-[0.5]"
							/>
						</ComposerPrimitive.Send>
					</ThreadPrimitive.If>
					<ThreadPrimitive.If running>
						<ComposerPrimitive.Cancel type="button" className="m-2 flex h-8 w-8 items-center justify-center rounded-lg bg-[#ae5630] text-2xl font-bold disabled:opacity-0">
							<StopIcon
								height={16}
								width={16}
								className="text-[#ddd] [&_path]:stroke-white [&_path]:stroke-[0.5]"
							/>
						</ComposerPrimitive.Cancel>
					</ThreadPrimitive.If>
				</div>
			</ComposerPrimitive.Root>
		</ThreadPrimitive.Root>
	);
};

export default ChatBotUI;
