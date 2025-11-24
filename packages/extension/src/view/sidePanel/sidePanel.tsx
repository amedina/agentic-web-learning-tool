/**
 * External dependencies
 */
import {
  AssistantRuntimeProvider,
} from "@assistant-ui/react";
import { lastAssistantMessageIsCompleteWithToolCalls } from 'ai';
import { useChatRuntime } from '@assistant-ui/react-ai-sdk';
/**
 * Internal dependencies
 */
import { ChatBotUI } from "./components";
import { GeminiNanoChatTransport } from "./transports/gemini/GeminiLocalTransport";
import { useEffect } from "react";

const geminiNanoTransport = new GeminiNanoChatTransport();

const SidePanel = () => {
   const runtime = useChatRuntime({
    transport: geminiNanoTransport,
    sendAutomaticallyWhen: (messages) => lastAssistantMessageIsCompleteWithToolCalls(messages),
  });

  useEffect(() => {
    geminiNanoTransport.setRuntime(runtime);
    geminiNanoTransport.initializeSession();
  }, [runtime]);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <ChatBotUI runtime={runtime} />
    </AssistantRuntimeProvider>
  )
};

export default SidePanel;
