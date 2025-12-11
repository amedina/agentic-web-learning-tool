/**
 * External dependencies
 */
import {
  AssistantRuntimeProvider,
} from "@assistant-ui/react";
import { lastAssistantMessageIsCompleteWithToolCalls } from 'ai';
import { useChatRuntime } from '@assistant-ui/react-ai-sdk';
import { useEffect } from "react";
/**
 * Internal dependencies
 */
import { ChatBotUI } from "./components";
import { GeminiNanoChatTransport } from "./transports/geminiNano";
//Declare and initialize Gemini Nano transport only once no need to recreate on every render
//Move this to a custom hook when more options for LLM is provided
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
