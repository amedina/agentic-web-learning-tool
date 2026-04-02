/**
 * External dependencies
 */
import { createAssistantStream } from "assistant-stream";
import type { ThreadMessage } from "@assistant-ui/react";
/**
 * Internal dependencies
 */
import { chatStorage } from "./chatStorage";
import type { RemoteThreadMetadata } from "./types";

const ChatAdapter = () => {
  return {
    list: async () => {
      const threads: RemoteThreadMetadata[] =
        await chatStorage.threads.findAll();

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
      const thread = await chatStorage.threads.create({ id: threadId });
      console.log("Initialized thread:", thread);
      return {
        remoteId: thread.remoteId,
        externalId: thread.externalId,
      };
    },

    rename: async (remoteId: string, newTitle: string) => {
      console.log("Renaming thread:", remoteId, "to", newTitle);
      chatStorage.threads.update(remoteId, {
        title: newTitle,
      });
    },

    archive: async (remoteId: string) => {
      chatStorage.threads.update(remoteId, { status: "archived" });
      chatStorage.messages.deleteByThreadId(remoteId);
      chatStorage.threads.delete(remoteId);
    },

    unarchive: async (remoteId: string) => {
      chatStorage.threads.update(remoteId, { status: "regular" });
    },

    delete: async (remoteId: string) => {
      chatStorage.messages.deleteByThreadId(remoteId);
      chatStorage.threads.delete(remoteId);
    },

    generateTitle: async (_remoteId: string, message: ThreadMessage[]) => {
      const title = message
        .filter((message) => message.role === "user")[0]
        .content.filter((message) => message.type === "text")[0]
        .text.substring(0, 30);

      const stream = createAssistantStream((controller) => {
        controller.appendText(title);
        controller.close();
      });
      return stream;
    },

    fetch: async (threadId: string) => {
      const threads: RemoteThreadMetadata[] =
        await chatStorage.threads.findAll();
      return threads.find(
        (thread) => thread.remoteId === threadId,
      ) as RemoteThreadMetadata;
    },
  };
};

export default ChatAdapter;
