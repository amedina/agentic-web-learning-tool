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

  const { allowToolCalling, isOptionsPage } = usePropProvider(({ state }) => ({
    allowToolCalling: state.allowToolCalling,
    isOptionsPage: state.isOptionsPage,
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
          <ConversationalChatBot
            runtime={runtimeRef.current}
            isOptionsPage={isOptionsPage}
          />
        ) : (
          <ChatBotUI runtime={runtimeRef.current} />
        ),
      },
      ...suffixTabs,
    ];
  }, [prefixTabs, suffixTabs, allowToolCalling]);

  const tabbedUI = useMemo(() => {
    if (tabsList.length > 1) {
      // The persisted `activeTab` can refer to a tab that isn't present in
      // the current `tabsList` (e.g. "report" was persisted on a github
      // package.json but the user opened an npm package page where no Report
      // tab is rendered). Fall back to the first tab so the content area
      // never ends up pointing at a non-existent tab.
      const resolvedActiveTab =
        tabsList.find((t) => t.value === activeTab)?.value ??
        tabsList[0]?.value;

      return (
        <Tabs
          value={resolvedActiveTab}
          onValueChange={setActiveTab}
          className="flex flex-col h-full w-full bg-background"
        >
          <TabsList className="relative flex w-full bg-transparent h-auto p-0 rounded-none gap-0 border-b">
            {tabsList.map((tab) => {
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex-1 rounded-none py-2.5 px-4 text-sm font-medium text-muted-foreground data-[state=active]:text-foreground data-[state=active]:bg-transparent hover:bg-accent/40 relative z-10 shadow-none data-[state=active]:shadow-none"
                >
                  {tab.label}
                </TabsTrigger>
              );
            })}
            <div
              className="absolute bottom-[-1px] h-[2px] bg-[#c94137] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
              style={{
                width: `${100 / tabsList.length}%`,
                left: `${
                  Math.max(
                    0,
                    tabsList.findIndex((t) => t.value === resolvedActiveTab)
                  ) *
                  (100 / tabsList.length)
                }%`,
              }}
            />
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
    return (
      <div className="flex flex-col h-full w-full bg-background">
        {subHeaderNode}
        {tabsList[0].content}
      </div>
    );
  }, [tabsList, activeTab, subHeaderNode, setActiveTab]);

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
