/**
 * External dependencies
 */
import { createAssistantStream } from 'assistant-stream';
import type { ThreadMessage } from '@assistant-ui/react';
/**
 * Internal dependencies
 */
import { dbConnection } from './dbConnection';
import type { RemoteThreadMetadata } from './types';

const ChatAdapter = () => {
  return {
    list: async () => {
      const threads: RemoteThreadMetadata[] =
        await dbConnection.threads.findAll();

      return {
        threads: threads.map((thread: RemoteThreadMetadata) => ({
          status: thread.status,
          remoteId: thread.remoteId,
          externalId: thread.externalId,
          title: thread.title,
        })),
      };
    },
    initialize: async (threadId: string) => {
      const thread = await dbConnection.threads.create({ id: threadId });

      return {
        remoteId: thread.remoteId,
        externalId: thread.externalId,
      };
    },

    rename: async (remoteId: string, newTitle: string) => {
      dbConnection.threads.update(remoteId, { title: newTitle });
    },

    archive: async (remoteId: string) => {
      dbConnection.threads.update(remoteId, { status: 'archived' });
    },

    unarchive: async (remoteId: string) => {
      dbConnection.threads.update(remoteId, { status: 'regular' });
    },

    delete: async (remoteId: string) => {
      dbConnection.messages.deleteByThreadId(remoteId);
      dbConnection.threads.delete(remoteId);
    },

    generateTitle: async (remoteId: string, message: ThreadMessage[]) => {
      console.log(message);
      const title = message
        .filter((message) => message.role === 'user')[0]
        .content.filter((message) => message.type === 'text')[0]
        .text.substring(0, 30);
      dbConnection.threads.update(remoteId, { title });
      const stream = createAssistantStream((controller) => {
        controller.appendText(title);
        controller.close();
      });
      return stream;
    },

    fetch: async (threadId: string) => {
      const threads: RemoteThreadMetadata[] =
        await dbConnection.threads.findAll();
      return threads.find(
        (thread) => thread.remoteId === threadId
      ) as RemoteThreadMetadata;
    },
  };
};

export default ChatAdapter;
