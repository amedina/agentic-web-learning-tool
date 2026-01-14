import {
  type unstable_RemoteThreadListAdapter as RemoteThreadListAdapter,
  type ThreadMessage,
} from '@assistant-ui/react';
import { createAssistantStream } from 'assistant-stream';
import type { RemoteThreadInitializeResponse } from 'node_modules/@assistant-ui/react/dist/legacy-runtime/runtime-cores/remote-thread-list/types';

export const STORAGE_KEYS = {
  THREADS: 'assistant_threads_meta',
  MESSAGES_PREFIX: 'assistant_msg_',
};

export interface ThreadMeta {
  remoteId: string;
  title: string;
  archived: boolean;
  createdAt: Date;
  messages: ThreadMessage[];
}
// Implement your custom adapter with proper message persistence
export const chromeSessionAdapter: RemoteThreadListAdapter = {
  async list() {
    // Direct call to chrome.storage
    const result: { [key: string]: ThreadMeta[] } =
      await chrome.storage.local.get(STORAGE_KEYS.THREADS);
    const threads: ThreadMeta[] = result[STORAGE_KEYS.THREADS] || [];

    return {
      threads: threads.map((t) => ({
        remoteId: t.remoteId,
        title: t.title,
        status: t.archived ? 'archived' : 'regular',
        messages: t.messages,
      })),
    };
  },

  async initialize(threadId) {
    const id = threadId || crypto.randomUUID();

    const result: { [key: string]: ThreadMeta[] } =
      await chrome.storage.local.get(STORAGE_KEYS.THREADS);
    const threads: ThreadMeta[] = result[STORAGE_KEYS.THREADS] || [];

    // Check if exists
    const existing = threads.find((t) => t.remoteId === id);
    if (existing) return { remoteId: existing.remoteId };

    // Create new
    const newThread: ThreadMeta = {
      remoteId: id,
      title: 'New Chat',
      archived: false,
      createdAt: new Date(),
      messages: [],
    };

    await chrome.storage.local.set({
      [STORAGE_KEYS.THREADS]: [newThread, ...threads],
    });

    const valueToReturn = {
      remoteId: id,
      externalId: crypto.randomUUID(),
    } as RemoteThreadInitializeResponse;

    return valueToReturn;
  },

  async rename(remoteId, newTitle) {
    const result: { [key: string]: ThreadMeta[] } =
      await chrome.storage.local.get(STORAGE_KEYS.THREADS);
    const threads: ThreadMeta[] = result[STORAGE_KEYS.THREADS] || [];

    const updated = threads.map((t) =>
      t.remoteId === remoteId ? { ...t, title: newTitle } : t
    );

    await chrome.storage.local.set({ [STORAGE_KEYS.THREADS]: updated });
  },

  async archive(remoteId) {
    const result: { [key: string]: ThreadMeta[] } =
      await chrome.storage.local.get(STORAGE_KEYS.THREADS);
    const threads: ThreadMeta[] = result[STORAGE_KEYS.THREADS] || [];

    const updated = threads.map((t) =>
      t.remoteId === remoteId ? { ...t, archived: true } : t
    );

    await chrome.storage.local.set({ [STORAGE_KEYS.THREADS]: updated });
  },

  async unarchive(remoteId) {
    const result: { [key: string]: ThreadMeta[] } =
      await chrome.storage.local.get(STORAGE_KEYS.THREADS);
    const threads: ThreadMeta[] = result[STORAGE_KEYS.THREADS] || [];

    const updated = threads.map((t) =>
      t.remoteId === remoteId ? { ...t, archived: false } : t
    );

    await chrome.storage.local.set({ [STORAGE_KEYS.THREADS]: updated });
  },

  async delete(remoteId) {
    // 1. Remove from meta list
    const result: { [key: string]: ThreadMeta[] } =
      await chrome.storage.local.get(STORAGE_KEYS.THREADS);
    const threads: ThreadMeta[] = result[STORAGE_KEYS.THREADS] || [];
    const updated = threads.filter((t) => t.remoteId !== remoteId);
    console.log(remoteId);
    await chrome.storage.local.set({ [STORAGE_KEYS.THREADS]: updated });
  },

  async generateTitle(remoteId, messages) {
    // Simple logic: grab first user message.
    // In production, you might call an LLM here to summarize.
    const firstUserMsg = messages.find((m) => m.role === 'user');
    const newTitle = firstUserMsg
      ? firstUserMsg.content
          .filter((_content) => _content.type === 'text')[0]
          .text.slice(0, 50)
      : 'New Chat';

    await this.rename(remoteId, newTitle);
    const stream = createAssistantStream((controller) => {
      controller.appendText(newTitle);
      controller.close();
    });

    return stream;
  },
};
