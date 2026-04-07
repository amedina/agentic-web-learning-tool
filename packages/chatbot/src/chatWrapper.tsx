/**
 * External dependencies
 */
import { type AssistantRuntime } from '@assistant-ui/react';
import { useEffect, useMemo, useRef } from 'react';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@google-awlt/design-system';
/**
 * Internal dependencies
 */
import { ChatBotUI, ConversationalChatBot } from './components';
import {
  CommandProvider,
  useModelProvider,
  usePropProvider,
} from './providers';
import CustomRuntimeProvider from './customRuntime/customRuntimeProvider';

const SidePanel = () => {
  const { transport } = useModelProvider(({ state }) => ({
    transport: state.transport,
  }));

  const { allowToolCalling } = usePropProvider(({ state }) => ({
    allowToolCalling: state.allowToolCalling,
  }));

  const {
    prefixTabs,
    suffixTabs,
    footerNode,
    subHeaderNode,
    activeTab,
    setActiveTab,
  } = usePropProvider(({ state, actions }) => ({
    prefixTabs: state.prefixTabs,
    suffixTabs: state.suffixTabs,
    footerNode: state.footerNode,
    subHeaderNode: state.subHeaderNode,
    activeTab: state.activeTab,
    setActiveTab: actions.setActiveTab,
  }));

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

  useEffect(() => {
    chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
      if (message.type === 'still_there') {
        sendResponse({ status: 'yes', type: 'sidepanel' });
      }
    });
  }, []);

  useEffect(() => {
    return () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs) {
          chrome.storage.session.remove(`sidebar_tab_${tabs[0].id}`);
        }
      });
    };
  }, []);

  const tabsList = useMemo(() => {
    return [
      ...prefixTabs,
      {
        value: 'chat',
        label: 'Ask AI',
        content: !allowToolCalling ? (
          <ConversationalChatBot runtime={runtimeRef.current} />
        ) : (
          <ChatBotUI runtime={runtimeRef.current} />
        ),
      },
      ...suffixTabs,
    ];
  }, [prefixTabs, suffixTabs, allowToolCalling]);

  useEffect(() => {
    if (tabsList.length > 0 && !activeTab) {
      setActiveTab(tabsList[0].value);
    }
  }, [tabsList]);

  const tabbedUI = useMemo(() => {
    if (tabsList.length > 1) {
      return (
        <Tabs
          defaultValue={tabsList[0].value}
          className="flex flex-col h-full w-full bg-background"
        >
          <TabsList className="flex w-full bg-transparent h-auto p-0 rounded-none border-b gap-0">
            {tabsList.map((tab) => {
              return (
                <TabsTrigger
                  onClick={() => setActiveTab(tab.value)}
                  key={tab.value}
                  value={tab.value}
                  className="flex-1 rounded-none py-2.5 px-4 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-[#c94137] data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none hover:bg-accent/40"
                >
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
          {subHeaderNode}
          {tabsList.map((tab) => {
            return (
              <TabsContent
                key={tab.value}
                value={tab.value}
                className={`flex-1 p-0 border-none mt-0 ${activeTab !== 'chat' ? 'overflow-y-auto' : 'overflow-hidden'}`}
              >
                {tab.content}
              </TabsContent>
            );
          })}
        </Tabs>
      );
    }
    return tabsList[0].content;
  }, [tabsList]);

  return (
    <CustomRuntimeProvider transport={transport} runtimeRef={runtimeRef}>
      <CommandProvider>
        {tabbedUI}
        {footerNode}
      </CommandProvider>
    </CustomRuntimeProvider>
  );
};

export default SidePanel;
