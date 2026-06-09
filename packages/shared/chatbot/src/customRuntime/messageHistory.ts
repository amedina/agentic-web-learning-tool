/**
 * Internal dependencies
 */
import type { SingleMessage } from './types';

/**
 * Re-derives a valid parent chain for a thread's stored messages so that
 * assistant-ui's `MessageRepository.import` can never throw "Parent message
 * not found" on a corrupted or incomplete history.
 *
 * Stored messages are a flat, ordered append-log of a linear conversation, so
 * a message's parent is simply the previous surviving message. A persisted
 * `parentId` is kept only while it still resolves to an earlier message in the
 * same list; otherwise the message is relinked to the previous message (or
 * `null` for the first). Without this, a single missing link (e.g. a message
 * dropped by the empty-parts guard, or an incomplete streaming message the
 * runtime never appended) makes `import` throw and collapses the whole thread
 * to an empty chat.
 *
 * @param messages - Stored messages for a single thread, in insertion order.
 * @returns New message objects with a guaranteed-resolvable `parentId` chain.
 */
export const repairParentChain = (
  messages: SingleMessage[]
): SingleMessage[] => {
  const seenIds = new Set<string>();
  let previousId: string | null = null;

  return messages.map((item) => {
    const id = item.message?.id ?? null;
    const parentResolves = item.parentId !== null && seenIds.has(item.parentId);
    const parentId = parentResolves ? item.parentId : previousId;

    if (id !== null) {
      seenIds.add(id);
      previousId = id;
    }

    return { ...item, parentId };
  });
};
