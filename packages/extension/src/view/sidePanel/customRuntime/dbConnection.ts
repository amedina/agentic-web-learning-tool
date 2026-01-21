/**
 * Internal dependencies
 */
import type { RemoteThreadMetadata, SingleMessage } from './types';

export const dbConnection = {
  threads: {
    async findAll(): Promise<RemoteThreadMetadata[]> {
      const raw = localStorage.getItem('assistant-ui-threads');
      return raw ? JSON.parse(raw) : [];
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
      localStorage.setItem('assistant-ui-threads', JSON.stringify(threads));

      return newThread;
    },

    async update(id: string, data: Partial<RemoteThreadMetadata>) {
      const threads = await this.findAll();

      const updatedThreads = threads.map((thread) =>
        thread.id === id ? { ...thread, ...data } : thread
      );

      localStorage.setItem(
        'assistant-ui-threads',
        JSON.stringify(updatedThreads)
      );
    },

    async delete(id: string) {
      const threads = await this.findAll();
      const filtered = threads.filter((t) => t.id !== id);
      localStorage.setItem('assistant-ui-threads', JSON.stringify(filtered));
    },
  },

  messages: {
    async findByThreadId(threadId: string) {
      const raw = localStorage.getItem('assistant-ui-messages');
      const allMessages = raw ? JSON.parse(raw) : [];
      return allMessages.filter(
        (message: SingleMessage) => message.threadId === threadId
      );
    },

    async create(message: SingleMessage) {
      const raw = localStorage.getItem('assistant-ui-messages');
      const messages = raw ? JSON.parse(raw) : [];
      //@ts-expect-error -- Ignoring this since tested and parts and content are used interchangebly in ai-sdk and Assistant-ui
      if (message?.message?.parts?.length === 0) {
        return;
      }

      messages.push(message);

      localStorage.setItem('assistant-ui-messages', JSON.stringify(messages));
    },

    async deleteByThreadId(threadId: string) {
      const raw = localStorage.getItem('assistant-ui-messages');
      const messages = raw ? JSON.parse(raw) : [];
      const filtered = messages.filter(
        (message: SingleMessage) => message.threadId !== threadId
      );
      localStorage.setItem('assistant-ui-messages', JSON.stringify(filtered));
    },
  },
};
