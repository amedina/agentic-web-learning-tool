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

    const append = useCallback(
      async (message: ExportedMessageRepositoryItem) => {
        const { remoteId } = await api.threadListItem().initialize();

        if (!remoteId) {
          return;
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
