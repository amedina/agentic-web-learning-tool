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
import type { PropsWithChildren, RefObject } from 'react';
/**
 * Internal dependencies
 */
import ChatAdapter from './chatAdapter';
import { HistoryAdapter } from './historyAdpter';
import type { GeminiNanoChatTransport } from '../transports/geminiNano';
import type { CloudHostedTransport } from '../transports/cloudHosted';

type CustomRuntimeProviderProps = PropsWithChildren & {
  runtimeRef: RefObject<AssistantRuntime | null>;
  transport: GeminiNanoChatTransport | CloudHostedTransport | null;
};

export default function CustomRuntimeProvider({
  children,
  runtimeRef,
  transport,
}: CustomRuntimeProviderProps) {
  const useMyCustomRuntime = () => {
    if (!transport) {
      return;
    }

    return useChatRuntime({
      messages: [],
      transport,
      sendAutomaticallyWhen: (messages) =>
        lastAssistantMessageIsCompleteWithToolCalls(messages),
    });
  };

  runtimeRef.current = useRemoteThreadListRuntime({
    //@ts-expect-error -- Ignore this since we have added a failsafe where runtime is being used
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
