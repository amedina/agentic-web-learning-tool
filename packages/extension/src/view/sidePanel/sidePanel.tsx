/**
 * External dependencies
 */
import { useChatRuntime } from '@assistant-ui/react-ai-sdk';
import {
  AssistantRuntimeProvider,
  type AssistantRuntime,
} from '@assistant-ui/react';
import { lastAssistantMessageIsCompleteWithToolCalls } from 'ai';
import { useEffect, useRef, useState } from 'react';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@google-awlt/design-system';

/**
 * Internal dependencies
 */
import { ChatBotUI, WorkflowList } from './components';
import { CommandProvider, useModelProvider } from './providers';

const SidePanel = () => {
  const { transport } = useModelProvider(({ state }) => ({
    transport: state.transport,
  }));

  const [activeTab, setActiveTab] = useState<chrome.tabs.Tab | null>(null);

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0) {
          setActiveTab(tabs[0]);
        }
      });

      const handleTabCreatedOrUpdated = () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs.length > 0) {
            setActiveTab(tabs[0]);
          }
        });
      };

      chrome.tabs.onActivated.addListener(handleTabCreatedOrUpdated);
      chrome.tabs.onUpdated.addListener(handleTabCreatedOrUpdated);

      return () => {
        chrome.tabs.onActivated.removeListener(handleTabCreatedOrUpdated);
        chrome.tabs.onUpdated.removeListener(handleTabCreatedOrUpdated);
      };
    }
  }, []);

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
            <WorkflowList
              activeTabId={activeTab?.id}
              activeTabUrl={activeTab?.url}
            />
          </TabsContent>
        </Tabs>
      </CommandProvider>
    </AssistantRuntimeProvider>
  );
};

export default SidePanel;
