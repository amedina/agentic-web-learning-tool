/**
 * External dependencies
 */
import type {
  ExportedMessageRepository,
  MessageFormatRepository,
  ThreadMessage,
} from "@assistant-ui/react";

export type ExportedMessageRepositoryItem = {
  message: ThreadMessage;
  parentId: string | null;
  runConfig?: {
    custom?: Record<string, unknown>;
  };
};

export type SingleMessage = {
  message: ThreadMessage;
  parentId: string | null;
  threadId: string;
};

export type LoadFunctionOutputType =
  | (ExportedMessageRepository & {
      unstable_resume?: boolean;
    })
  | MessageFormatRepository<ThreadMessage>;

export type RemoteThreadMetadata = {
  readonly status: "archived" | "regular";
  readonly remoteId: string;
  readonly externalId?: string | undefined;
  readonly tabId?: number | undefined;
  readonly title?: string | undefined;
  readonly id?: string;
};
