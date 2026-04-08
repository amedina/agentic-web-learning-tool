/**
 * External dependencies
 */
import {
  ComposerPrimitive,
  ThreadPrimitive,
  useAssistantApi,
  useAssistantState,
  type AssistantRuntime,
} from '@assistant-ui/react';
import { useCallback, useEffect, useMemo } from 'react';
import {
  Paperclip,
  SendHorizontal,
  CircleStop,
  Settings,
  ChevronDown,
} from 'lucide-react';
import {
  Button,
  Dropdown,
  OwlIcon,
  SidebarInset,
  ThreadListSidebar,
} from '@google-awlt/design-system';
/**
 * Internal dependencies
 */
import {
  useModelProvider,
  usePropProvider,
  useTabThreadInformation,
} from '../../providers';
import AssistantMessage from './assistantMessage';
import EditComposer from './editComposer';
import UserMessage from './userMessage';
import { INITIAL_PROVIDERS } from '../../constants';
import type { AgentType } from '../../../types';
import { useCommandProvider } from '../../providers/commandProvider';
import { createModelDropdown } from './utils';
import type { ChatDataType } from '../../customRuntime/types';

type ConversationalChatBotProps = {
  runtime: AssistantRuntime | null;
};

const ConversationalChatBot = ({ runtime }: ConversationalChatBotProps) => {
  const { apiKeys, setSelectedAgent, selectedAgent } = useModelProvider(
    ({ state, actions }) => ({
      apiKeys: state.apiKeys,
      toolNameToMCPMap: state.toolNameToMCPMap,
      setSelectedAgent: actions.setSelectedAgent,
      selectedAgent: state.selectedAgent,
    })
  );

  const api = useAssistantApi();

  const { lockedThreads } = useTabThreadInformation(({ state }) => ({
    lockedThreads: state.lockedThreads,
  }));

  const {
    CustomAssistantMessageComponent,
    CustomUserMessageComponent,
    CustomEditComposerComponent,
    CustomIcon,
    suggestions,
    helperTextSet,
    allowChatStorage,
    exportChatCallback,
    switchToNewThreadRef,
    triggerExportChatRef,
  } = usePropProvider(({ state, actions }) => ({
    CustomIcon: state.CustomIcon,
    suggestions: state.suggestions,
    helperTextSet: state.helperTextSet,
    allowChatStorage: state.allowChatStorage,
    exportChatCallback: actions.exportChatCallback,
    switchToNewThreadRef: actions.switchToNewThreadRef,
    triggerExportChatRef: actions.triggerExportChatRef,
    CustomAssistantMessageComponent: state.CustomAssistantMessageComponent,
    CustomUserMessageComponent: state.CustomUserMessageComponent,
    CustomEditComposerComponent: state.CustomEditComposerComponent,
  }));

  const threadId = useAssistantState(({ threadListItem }) => threadListItem.id);
  const messages = useAssistantState(({ thread }) => thread.messages);
  const isLoading = useAssistantState(({ threads }) => threads.isLoading);

  const { handleMessageChange } = useCommandProvider(({ actions }) => ({
    handleMessageChange: actions.handleMessageChange,
  }));

  const handleSelect = useCallback(
    (selectedId: string) => {
      const agent: AgentType = {
        modelProvider: '',
        model: '',
      };

      INITIAL_PROVIDERS.forEach((provider) => {
        const selectedModel = provider.models.find(
          (model) => model.id === selectedId
        );

        if (selectedModel) {
          agent.modelProvider = provider.id;
          agent.model = selectedModel.id;
        }
      });

      setSelectedAgent(agent);
    },
    [setSelectedAgent]
  );

  const lockThread = useCallback(
    async (threadIdToLock: string) => {
      await chrome.storage.session.set({
        lockedThreads: [...lockedThreads, threadIdToLock],
      });
    },
    [lockedThreads]
  );

  const unlockThread = useCallback(
    async (threadIdToUnlock: string) => {
      const unlockedThreads = lockedThreads.filter(
        (id) => id !== threadIdToUnlock
      );
      await chrome.storage.session.set({ lockedThreads: unlockedThreads });
    },
    [lockedThreads]
  );

  api.on('thread.run-end', async ({ threadId: threadIdToUnlock }) => {
    setTimeout(async () => {
      await unlockThread(threadIdToUnlock);
    }, 500);
  });

  api.on('composer.send', async ({ threadId: threadIdToLock }) => {
    await lockThread(threadIdToLock);
  });

  //Only shows models whose apiKeys have been and have been enabled
  const modelOptions = useMemo(() => createModelDropdown(apiKeys), [apiKeys]);

  const exportChat = useCallback(async () => {
    const chatData = api.thread().getState()
      .messages as unknown as ChatDataType[];
    const title = api.threadListItem().getState().title;
    if (chatData && exportChatCallback && title) {
      exportChatCallback(chatData, `conversation-${Date.now()}-${title}.md`);
    }
  }, [exportChatCallback, api]);

  useEffect(() => {
    switchToNewThreadRef.current = () => runtime?.threads.switchToNewThread();
    triggerExportChatRef.current = exportChat;
  }, [runtime, exportChat, switchToNewThreadRef, triggerExportChatRef]);

  const handleOpenOptions = () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('options/options.html'));
    }
  };

  return (
    <>
      {allowChatStorage && <ThreadListSidebar isThreadLoading={isLoading} />}
      <SidebarInset className="h-full">
        <ThreadPrimitive.Root className="h-full flex flex-col">
          <ThreadPrimitive.Viewport
            autoScroll={true}
            turnAnchor="bottom"
            className={`flex flex-1 items-center overflow-y-auto scroll-smooth px-4 md:px-0 ${messages.length === 0 ? '' : 'h-full'}`}
          >
            <div
              className={`max-w-3xl mx-auto w-full flex flex-col ${messages.length === 0 ? '' : 'h-full'}`}
            >
              {/* Empty State / Welcome */}
              <ThreadPrimitive.Empty>
                <div className="flex flex-col items-center justify-center text-center px-4">
                  <div className="mb-3">
                    {CustomIcon ?? <OwlIcon width={42} height={42} />}
                  </div>
                  <h2 className="text-2xl font-bold text-primary mb-2">
                    {helperTextSet?.title()}
                  </h2>
                  <p className="text-zinc-500 max-w-md">
                    {helperTextSet?.description()}
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center w-full mt-6">
                    {suggestions?.map((s, i) => (
                      <ThreadPrimitive.Suggestion
                        key={i}
                        prompt={s.prompt}
                        className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-full px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm cursor-pointer"
                        method="replace"
                        autoSend
                      >
                        <span>{s.text}</span>
                      </ThreadPrimitive.Suggestion>
                    ))}
                  </div>
                </div>
              </ThreadPrimitive.Empty>
              <div className="h-full mt-8">
                <ThreadPrimitive.Messages
                  components={{
                    UserMessage: CustomUserMessageComponent
                      ? CustomUserMessageComponent
                      : UserMessage,
                    EditComposer: CustomEditComposerComponent
                      ? CustomEditComposerComponent
                      : EditComposer,
                    AssistantMessage: CustomAssistantMessageComponent
                      ? CustomAssistantMessageComponent
                      : AssistantMessage,
                  }}
                />
              </div>
            </div>
          </ThreadPrimitive.Viewport>
          <div className="bg-gradient from-foreground via-foreground to-transparent pb-2 px-4">
            <div className="text-center mt-3 mb-1 text-[10px] text-exclusive-plum">
              AI can make mistakes. Please verify important information.
            </div>
            <div className="max-w-3xl mx-auto w-full">
              <ComposerPrimitive.Root className="relative flex flex-col gap-2 rounded-md border border-zinc-200 bg-background shadow-xl shadow-subtle-zinc/20 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all overflow-hidden">
                <ComposerPrimitive.Input
                  placeholder="Ask anything..."
                  onKeyDown={handleMessageChange}
                  submitOnEnter={
                    lockedThreads.includes(threadId) ? false : true
                  }
                  className="w-full max-h-40 min-h-[56px] resize-none bg-transparent px-4 py-4 text-sm outline-none placeholder:exclusive-plum text-primary"
                />
                <div className="flex items-center justify-between gap-2 px-3 mb-1">
                  <div className="flex items-center">
                    <Button variant="ghost" disabled title="Attach" size="icon">
                      <Paperclip size={18} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleOpenOptions}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Dropdown
                      options={modelOptions}
                      onSelect={(id) => handleSelect(id)}
                      mainLabel="Providers"
                      selectedValue={selectedAgent.model}
                    >
                      <Button variant="ghost" className="rounded-2xl">
                        <span className="text-[11px] flex flex-row items-center">
                          {selectedAgent.model}{' '}
                          <ChevronDown className="w-4 h-4" />
                        </span>
                      </Button>
                    </Dropdown>
                  </div>
                  {!lockedThreads.includes(threadId) && (
                    <ThreadPrimitive.If running={false}>
                      <ComposerPrimitive.Send
                        onClick={handleMessageChange}
                        className="h-9 w-9 flex items-center justify-center rounded-lg bg-background hover:text-ring text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <SendHorizontal size={18} />
                      </ComposerPrimitive.Send>
                    </ThreadPrimitive.If>
                  )}
                  <ThreadPrimitive.If running>
                    <ComposerPrimitive.Cancel className="h-9 w-9 flex items-center justify-center rounded-lg bg-background hover:text-ring text-foreground hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                      <CircleStop size={18} />
                    </ComposerPrimitive.Cancel>
                  </ThreadPrimitive.If>
                </div>
              </ComposerPrimitive.Root>
            </div>
          </div>
        </ThreadPrimitive.Root>
      </SidebarInset>
    </>
  );
};

export default ConversationalChatBot;
