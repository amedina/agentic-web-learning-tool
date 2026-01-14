/**
 * External dependencies
 */
import { useChatRuntime } from '@assistant-ui/react-ai-sdk';
import {
  AssistantRuntimeProvider,
  unstable_useRemoteThreadListRuntime,
  type AssistantApi,
  type AssistantRuntime,
  type ThreadMessage,
} from '@assistant-ui/react';
import {
  lastAssistantMessageIsCompleteWithToolCalls,
  type UIDataTypes,
  type UIMessage,
  type UITools,
} from 'ai';
import { useEffect, useRef, useState } from 'react';
import { SidebarProvider } from '@google-awlt/design-system';
/**
 * Internal dependencies
 */
import { ChatBotUI } from './components';
import { CommandProvider, useModelProvider } from './providers';
import {
  chromeSessionAdapter,
  STORAGE_KEYS,
  type ThreadMeta,
} from './localRuntime/chromeStorageAdapter';

type Messages = UIMessage<unknown, UIDataTypes, UITools>[];
const SidePanel = () => {
  const { transport } = useModelProvider(({ state }) => ({
    transport: state.transport,
  }));
  const [_messages, setMessages] = useState<Messages>([]);
  const assistantRef = useRef<AssistantApi | null>(null);
  const runtimeRef = useRef<AssistantRuntime | null>(null);
  const [currentThreadId, setCurrentThreadId] = useState('');

  useEffect(() => {
    chrome.storage.local.get(
      STORAGE_KEYS.THREADS,
      (result: { [key: string]: ThreadMeta[] }) => {
        if (!currentThreadId) {
          return;
        }
        const threads: ThreadMeta[] = result[STORAGE_KEYS.THREADS] || [];
        const thread = threads.find(
          (_thread) => _thread?.remoteId === currentThreadId
        );

        if (thread) {
          setMessages(thread.messages as unknown as Messages);
        }
      }
    );
  }, [currentThreadId]);

  runtimeRef.current = unstable_useRemoteThreadListRuntime({
    adapter: chromeSessionAdapter,
    runtimeHook: () =>
      useChatRuntime({
        //@ts-expect-error -- transport will be initialised once available
        transport,
        messages: _messages as unknown as Messages,
        onFinish: async ({ messages, message }) => {
          if (!assistantRef.current) {
            return;
          }

          const { remoteId } = assistantRef.current.threadListItem().getState();

          if (!remoteId) {
            return;
          }

          await chromeSessionAdapter.initialize(remoteId);
          const result: { [key: string]: ThreadMeta[] } =
            await chrome.storage.local.get(STORAGE_KEYS.THREADS);
          const threads: ThreadMeta[] = result[STORAGE_KEYS.THREADS] || [];
          const thread = threads.find(
            (_thread) => _thread?.remoteId === remoteId
          );
          if (thread) {
            thread.messages = messages.map((message) => {
              return {
                id: message.id,
                role: message.role,
                content: message.parts
                  ?.map((part) => {
                    if (part.type === 'step-start') {
                      return;
                    }

                    return {
                      text: part?.text,
                      type: 'text',
                    };
                  })
                  .filter((message) => Boolean(message)),
              };
            }) as unknown as ThreadMessage[];
          }

          if (thread && thread.messages.length > 1) {
            // You could call an API to summarize, or just use the first user message
            const firstUserMsg =
              thread.messages[0].content[0].text.substring(0, 30) + '...';
            await chromeSessionAdapter.rename(thread.remoteId, firstUserMsg);
          }

          const newThreads = threads.map((_thread) => {
            if (_thread.remoteId === thread?.remoteId) {
              return thread;
            }
            return _thread;
          });

          setMessages((prev) => {
            prev.push(message);
            return prev;
          });

          await chrome.storage.local.set({
            [STORAGE_KEYS.THREADS]: newThreads,
          });
        },
        sendAutomaticallyWhen: (messages) =>
          lastAssistantMessageIsCompleteWithToolCalls(messages),
      }),
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
          <ChatBotUI
            assistantRef={assistantRef}
            setCurrentThreadId={setCurrentThreadId}
            runtime={runtimeRef.current}
          />
        </SidebarProvider>
      </CommandProvider>
    </AssistantRuntimeProvider>
  );
};

export default SidePanel;
