/**
 * External dependencies
 */
import { useChatRuntime } from '@assistant-ui/react-ai-sdk';
import {
  AssistantRuntimeProvider,
  type AssistantRuntime,
} from '@assistant-ui/react';
import { lastAssistantMessageIsCompleteWithToolCalls } from 'ai';
import { useEffect, useRef } from 'react';
import { SidebarProvider } from '@google-awlt/design-system';
/**
 * Internal dependencies
 */
import { ChatBotUI } from './components';
import { CommandProvider, useModelProvider } from './providers';

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
        <SidebarProvider>
          <ChatBotUI runtime={runtimeRef.current} />
        </SidebarProvider>
      </CommandProvider>
    </AssistantRuntimeProvider>
  );
};

export default SidePanel;
