/**
 * External dependencies
 */
import {
  AssistantRuntimeProvider,
} from "@assistant-ui/react";
import { lastAssistantMessageIsCompleteWithToolCalls } from 'ai';
import { AssistantChatTransport, useChatRuntime } from '@assistant-ui/react-ai-sdk';
/**
 * Internal dependencies
 */
import { ChatBotUI } from "./components";

const SidePanel = () => {
   const runtime = useChatRuntime({
    transport: new AssistantChatTransport({
      api: 'https://webmcp-backend-prod-v2.alexmnahas.workers.dev/api/chat',
      headers: {
        'x-model-provider': 'anthropic',
        'x-model-name': 'claude-sonnet-4-5-20250929',
      },
    }),
    sendAutomaticallyWhen: (messages) => lastAssistantMessageIsCompleteWithToolCalls(messages),
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <ChatBotUI runtime={runtime} />
    </AssistantRuntimeProvider>
  )
};

export default SidePanel;
