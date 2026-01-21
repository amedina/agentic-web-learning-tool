/**
 * Internal dependencies
 */
import type { RemoteThreadMetadata, SingleMessage } from './types';

export const dbConnection = {
  threads: {
    async findAll(): Promise<RemoteThreadMetadata[]> {
      const { storedThreads = [] } = await chrome.storage.local.get(
        'assistant-ui-threads'
      );
      return storedThreads as RemoteThreadMetadata[];
    },

    async create({ id }: { id: string }) {
      const newThread: RemoteThreadMetadata = {
        id,
        remoteId: id,
        title: 'New Chat',
        status: 'regular',
        externalId: id,
      };

      const threads = await this.findAll();
      threads.push(newThread);
      chrome.storage.local.set({
        'assistant-ui-threads': threads,
      });

      return newThread;
    },

    async update(id: string, data: Partial<RemoteThreadMetadata>) {
      const threads = await this.findAll();

      const updatedThreads = threads.map((thread) =>
        thread.id === id ? { ...thread, ...data } : thread
      );

      chrome.storage.local.set({
        'assistant-ui-threads': updatedThreads,
      });
    },

    async delete(id: string) {
      const threads = await this.findAll();
      const filteredThreads = threads.filter((thread) => thread.id !== id);

      chrome.storage.local.set({
        'assistant-ui-threads': filteredThreads,
      });
    },
  },

  messages: {
    async findByThreadId(threadId: string) {
      const { messages = [] } = await chrome.storage.local.get(
        'assistant-ui-messages'
      );
      const allMessages = messages as SingleMessage[];
      return allMessages.filter(
        (message: SingleMessage) => message.threadId === threadId
      );
    },

    async create(message: SingleMessage) {
      const { messages = [] } = await chrome.storage.local.get(
        'assistant-ui-messages'
      );
      const allMessages = messages as SingleMessage[];
      //@ts-expect-error -- Ignoring this since tested and parts and content are used interchangebly in ai-sdk and Assistant-ui
      if (message?.message?.parts?.length === 0) {
        return;
      }

      allMessages.push(message);

      chrome.storage.local.set({
        'assistant-ui-threads': messages,
      });
    },

    async deleteByThreadId(threadId: string) {
      const { messages = [] } = await chrome.storage.local.get(
        'assistant-ui-messages'
      );
      const allMessages = messages as SingleMessage[];
      const filteredMessages = allMessages.filter(
        (message: SingleMessage) => message.threadId !== threadId
      );
      chrome.storage.local.set({
        'assistant-ui-threads': filteredMessages,
      });
    },
  },
};
