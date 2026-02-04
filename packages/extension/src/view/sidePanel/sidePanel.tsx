/**
 * External dependencies
 */
import { type AssistantRuntime } from '@assistant-ui/react';
import { useEffect, useRef, useState } from 'react';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@google-awlt/design-system';
import { SidebarProvider } from '@google-awlt/design-system';
/**
 * Internal dependencies
 */
import { ChatBotUI, WorkflowList } from './components';
import { CommandProvider, useModelProvider } from './providers';
import CustomRuntimeProvider from './customRuntime/customRuntimeProvider';

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
    <CustomRuntimeProvider transport={transport} runtimeRef={runtimeRef}>
      <CommandProvider>
        <SidebarProvider defaultOpen={false}>
          <Tabs
            defaultValue="chat"
            className="flex flex-col h-screen w-full bg-background"
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
        </SidebarProvider>
      </CommandProvider>
    </CustomRuntimeProvider>
  );
};

export default SidePanel;
