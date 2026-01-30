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
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@google-awlt/design-system';

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
        <Tabs
          defaultValue="chat"
          className="flex flex-col h-screen bg-background"
        >
          <div className="px-4 py-2 border-b">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="workflows">Workflows</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent
            value="chat"
            className="flex-1 overflow-hidden p-0 border-none mt-0"
          >
            <ChatBotUI runtime={runtimeRef.current} />
          </TabsContent>
          <TabsContent
            value="workflows"
            className="flex-1 overflow-hidden p-4 border-none mt-0"
          >
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2">
              <div className="text-lg font-medium">Workflows</div>
              <div className="text-sm italic">Coming soon...</div>
            </div>
          </TabsContent>
        </Tabs>
      </CommandProvider>
    </AssistantRuntimeProvider>
  );
};

export default SidePanel;
