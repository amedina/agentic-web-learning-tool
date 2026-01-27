/**
 * External dependencies
 */
import {
  AssistantRuntimeProvider,
  unstable_useRemoteThreadListRuntime as useRemoteThreadListRuntime,
  type AssistantRuntime,
} from '@assistant-ui/react';
import { useChatRuntime } from '@assistant-ui/react-ai-sdk';
import { lastAssistantMessageIsCompleteWithToolCalls } from 'ai';
import {
  useCallback,
  useEffect,
  type PropsWithChildren,
  type RefObject,
} from 'react';
/**
 * Internal dependencies
 */
import ChatAdapter from './chatAdapter';
import { HistoryAdapter } from './historyAdpter';
import type { GeminiNanoChatTransport } from '../transports/geminiNano';
import type { CloudHostedTransport } from '../transports/cloudHosted';
import { dbConnection } from './dbConnection';

type CustomRuntimeProviderProps = PropsWithChildren & {
  runtimeRef: RefObject<AssistantRuntime | null>;
  transport: GeminiNanoChatTransport | CloudHostedTransport;
};

export default function CustomRuntimeProvider({
  children,
  runtimeRef,
  transport,
}: CustomRuntimeProviderProps) {
  const useMyCustomRuntime = () => {
    return useChatRuntime({
      messages: [],
      transport,
      sendAutomaticallyWhen: (messages) =>
        lastAssistantMessageIsCompleteWithToolCalls(messages),
    });
  };

  const onCreatedListener = useCallback(async () => {
    if (!runtimeRef.current) {
      return;
    }

    await runtimeRef.current.threads.switchToNewThread();
  }, [runtimeRef]);

  useEffect(() => {
    (async () => {
      if (!runtimeRef.current) {
        return;
      }

      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      const activeTab = tabs[0];
      if (!activeTab) {
        return;
      }

      const threads = await dbConnection.threads.findAll();
      const currentTabThread = threads.find(
        (thread) => thread.tabId === activeTab.id
      );

      if (!currentTabThread) {
        await runtimeRef.current.threads.switchToNewThread();
        return;
      }

      runtimeRef.current.threads.switchToThread(currentTabThread.remoteId);
    })();
  }, [runtimeRef]);

  useEffect(() => {
    chrome.tabs.onCreated.addListener(onCreatedListener);
    return () => {
      chrome.tabs.onCreated.removeListener(onCreatedListener);
    };
  }, [onCreatedListener]);

  runtimeRef.current = useRemoteThreadListRuntime({
    // eslint-disable-next-line react-hooks/rules-of-hooks
    runtimeHook: () => useMyCustomRuntime(),
    adapter: {
      ...ChatAdapter(),
      unstable_Provider: HistoryAdapter(),
    },
    allowNesting: true,
  });

  return (
    <AssistantRuntimeProvider runtime={runtimeRef.current}>
      {children}
    </AssistantRuntimeProvider>
  );
}
