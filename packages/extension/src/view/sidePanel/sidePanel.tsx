/**
 * External dependencies
 */
import {
  AssistantRuntimeProvider,
} from "@assistant-ui/react";
import { lastAssistantMessageIsCompleteWithToolCalls } from 'ai';
import { useChatRuntime } from '@assistant-ui/react-ai-sdk';
import { useEffect, useState } from "react";
/**
 * Internal dependencies
 */
import { ChatBotUI } from "./components";
import { transportGenerator } from "./transports";

const SidePanel = () => {
   const [transport, _setTransport] = useState(transportGenerator());
   const runtime = useChatRuntime({
    transport,
    sendAutomaticallyWhen: (messages) => lastAssistantMessageIsCompleteWithToolCalls(messages),
  });

 useEffect(() => {
    transport.setRuntime(runtime);
    transport.initializeSession();
  }, [runtime]);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <ChatBotUI runtime={runtime} />
    </AssistantRuntimeProvider>
  )
};

export default SidePanel;
