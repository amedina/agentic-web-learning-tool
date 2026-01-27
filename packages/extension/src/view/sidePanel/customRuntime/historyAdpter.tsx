/**
 * External dependencies
 */
import { useMemo, useCallback, type PropsWithChildren } from 'react';
import { RuntimeAdapterProvider, useAssistantApi } from '@assistant-ui/react';
/**
 * Internal dependencies
 */
import { dbConnection } from './dbConnection';
import type {
  LoadFunctionOutputType,
  ExportedMessageRepositoryItem,
} from './types';

export const HistoryAdapter = () => {
  return useCallback(function Provider({ children }: PropsWithChildren) {
    const api = useAssistantApi();

    const load = useCallback(async () => {
      const { remoteId } = await api.threadListItem().initialize();

      if (!remoteId) {
        return { messages: [] };
      }

      const messages = await dbConnection.messages.findByThreadId(remoteId);
      return {
        messages,
        unstable_resume: false,
      } as LoadFunctionOutputType;
    }, [api]);

    api.on('thread-list-item.switched-to', ({ threadId }) => {
      chrome.tabs
        .query({ active: true, currentWindow: true })
        .then(async ([tab]) => {
          if (tab?.id) {
            const allThreads = await dbConnection.threads.findAll();
            console.log(tab.id, allThreads);
            const threads = await dbConnection.threads.findAll();
            const previousThread = threads.find(
              (thread) => thread.tabId === tab.id
            );

            const updates = [];

            if (previousThread) {
              updates.push({ id: previousThread.remoteId, data: { tabId: 0 } });
              console.log(
                'Clearing tabId from previous thread',
                previousThread,
                updates,
                tab.id
              );
            }

            updates.push({ id: threadId, data: { tabId: tab.id } });
            console.log(
              'Setting tabId to new thread',
              threadId,
              updates,
              tab.id
            );
            await dbConnection.threads.batchUpdate(updates);
          }
        });
    });

    const append = useCallback(
      async (message: ExportedMessageRepositoryItem) => {
        const { remoteId } = await api.threadListItem().initialize();

        if (!remoteId) {
          return;
        }

        const messages = await dbConnection.messages.findByThreadId(remoteId);

        if (message.message.role === 'user' && messages.length === 0) {
          //@ts-expect-error -- We are sure that the first message will have text part.
          const messageTitle = message.message.parts
            //@ts-expect-error -- We are sure that the first message will have text part.
            .filter((part) => part.type === 'text')[0]
            .text.substring(0, 30);

          dbConnection.threads.update(remoteId, { title: messageTitle });
        }

        await dbConnection.messages.create({
          ...message,
          threadId: remoteId,
        });
      },
      [api]
    );

    const history = useMemo(
      () => ({
        load,
        append,
        withFormat(_formatAdapter: any) {
          return {
            load,
            append,
          };
        },
      }),
      [load, append]
    );

    const adapters = useMemo(() => ({ history }), [history]);

    return (
      //@ts-expect-error -- Both functions return same format since we are storing the data in chrome local storage.
      <RuntimeAdapterProvider adapters={adapters}>
        {children}
      </RuntimeAdapterProvider>
    );
  }, []);
};
