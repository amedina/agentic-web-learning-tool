/**
 * Internal dependencies
 */
import type { RemoteThreadMetadata, SingleMessage } from './types';

export const dbConnection = {
  threads: {
    async findAll(): Promise<RemoteThreadMetadata[]> {
      const { 'assistant-ui-threads': storedThreads = [] } =
        await chrome.storage.local.get('assistant-ui-threads');
      return storedThreads as RemoteThreadMetadata[];
    },

    async setLastActiveThreadId(threadId: string, tabId: number) {
      const {
        lastActiveThreadsStore = {},
      }: { lastActiveThreadsStore: { [key: number]: string } } =
        await chrome.storage.local.get('lastActiveThreadsStore');

      lastActiveThreadsStore[tabId] = threadId;

      await chrome.storage.local.set({
        lastActiveThreadsStore,
      });
    },

    async getLastActiveThreadId(tabId: number) {
      const {
        lastActiveThreadsStore = {},
      }: { lastActiveThreadsStore: { [key: number]: string } } =
        await chrome.storage.local.get('lastActiveThreadsStore');

      return lastActiveThreadsStore[tabId];
    },

    async create({ id }: { id: string }) {
      const currentTab = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      const newThread: RemoteThreadMetadata = {
        id,
        remoteId: id,
        title: 'New Chat',
        status: 'regular',
        tabId: currentTab[0]?.id,
        externalId: id,
      };

      const threads = await this.findAll();
      threads.push(newThread);
      await chrome.storage.local.set({
        'assistant-ui-threads': threads,
      });

      return newThread;
    },

    async update(id: string, data: Partial<RemoteThreadMetadata>) {
      const threads = await this.findAll();

      const updatedThreads = threads.map((thread) =>
        thread.id === id ? { ...thread, ...data } : thread
      );

      await chrome.storage.local.set({
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
      const { 'assistant-ui-messages': messages = [] } =
        await chrome.storage.local.get('assistant-ui-messages');
      const allMessages = messages as SingleMessage[];
      return allMessages.filter(
        (message: SingleMessage) => message.threadId === threadId
      );
    },

    async create(message: SingleMessage) {
      const { 'assistant-ui-messages': messages = [] } =
        await chrome.storage.local.get('assistant-ui-messages');
      const allMessages = messages as SingleMessage[];
      //@ts-expect-error -- Ignoring this since tested and parts and content are used interchangebly in ai-sdk and Assistant-ui
      if (message?.message?.parts?.length === 0) {
        return;
      }

      allMessages.push(message);

      await chrome.storage.local.set({
        'assistant-ui-messages': allMessages,
      });
    },

    async deleteByThreadId(threadId: string) {
      const { 'assistant-ui-messages': messages = [] } =
        await chrome.storage.local.get('assistant-ui-messages');
      const allMessages = messages as SingleMessage[];
      const filteredMessages = allMessages.filter(
        (message: SingleMessage) => message.threadId !== threadId
      );
      await chrome.storage.local.set({
        'assistant-ui-messages': filteredMessages,
      });
    },
  },
};
