/**
 * External dependencies
 */
import { type AssistantRuntime } from "@assistant-ui/react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@google-awlt/design-system";
import { SidebarProvider } from "@google-awlt/design-system";
/**
 * Internal dependencies
 */
import { ChatBotUI, ConversationalChatBot } from "./components";
import {
  CommandProvider,
  useModelProvider,
  usePropProvider,
} from "./providers";
import CustomRuntimeProvider from "./customRuntime/customRuntimeProvider";

const SidePanel = () => {
  const { transport } = useModelProvider(({ state }) => ({
    transport: state.transport,
  }));

  const [activeTab, setActiveTab] = useState<string>("chat");

  const { allowToolCalling } = usePropProvider(({ state }) => ({
    allowToolCalling: state.allowToolCalling,
  }));

  const { extraTabs, footerNode } = usePropProvider(({ state }) => ({
    extraTabs: state.extraTabs,
    footerNode: state.footerNode,
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
      if (message.type === "still_there") {
        sendResponse({ status: "yes", type: "sidepanel" });
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
      {
        value: "chat",
        label: "Chat",
        content: !allowToolCalling ? (
          <ConversationalChatBot runtime={runtimeRef.current} />
        ) : (
          <ChatBotUI runtime={runtimeRef.current} />
        ),
      },
      ...extraTabs,
    ];
  }, [extraTabs]);

  return (
    <CustomRuntimeProvider transport={transport} runtimeRef={runtimeRef}>
      <CommandProvider>
        <SidebarProvider
          defaultOpen={false}
          className={`flex-1 ${activeTab === "insights" ? "overflow-y-auto" : "overflow-hidden"}`}
        >
          <Tabs
            defaultValue="chat"
            className="flex flex-col h-full w-full bg-background"
          >
            <div className="px-4 py-2 border-b">
              <TabsList className="grid w-full grid-cols-2">
                {tabsList.map((tab) => {
                  return (
                    <TabsTrigger
                      onClick={() => setActiveTab(tab.value)}
                      key={tab.value}
                      value={tab.value}
                    >
                      {tab.label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>
            {tabsList.map((tab) => {
              return (
                <TabsContent
                  key={tab.value}
                  value={tab.value}
                  className={`flex-1 p-0 border-none mt-0 ${activeTab !== "chat" ? "overflow-y-auto" : "overflow-hidden"}`}
                >
                  {tab.content}
                </TabsContent>
              );
            })}
          </Tabs>
          {footerNode}
        </SidebarProvider>
      </CommandProvider>
    </CustomRuntimeProvider>
  );
};

export default SidePanel;
