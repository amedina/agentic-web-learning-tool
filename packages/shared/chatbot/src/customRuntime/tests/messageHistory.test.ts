/**
 * Internal dependencies
 */
import { repairParentChain } from '../messageHistory';
import type { SingleMessage } from '../types';

/** Builds a minimal stored message; the helper only reads `message.id`. */
const makeMessage = (id: string, parentId: string | null): SingleMessage =>
  ({
    threadId: 'thread-1',
    parentId,
    message: { id } as SingleMessage['message'],
  }) as SingleMessage;

const parentIds = (messages: SingleMessage[]) =>
  repairParentChain(messages).map((message) => message.parentId);

describe('repairParentChain', () => {
  it('keeps an already-valid linear chain unchanged', () => {
    const input = [
      makeMessage('a', null),
      makeMessage('b', 'a'),
      makeMessage('c', 'b'),
    ];
    expect(parentIds(input)).toEqual([null, 'a', 'b']);
  });

  it('relinks a dangling parentId to the previous message', () => {
    const input = [makeMessage('a', null), makeMessage('b', 'missing')];
    expect(parentIds(input)).toEqual([null, 'a']);
  });

  it('nulls a first message that points at a non-existent parent', () => {
    const input = [makeMessage('a', 'ghost'), makeMessage('b', 'a')];
    expect(parentIds(input)).toEqual([null, 'a']);
  });

  it('bridges a gap left by a dropped (never-persisted) message', () => {
    // 'b' was never stored, so 'c' references an absent parent.
    const input = [makeMessage('a', null), makeMessage('c', 'b')];
    expect(parentIds(input)).toEqual([null, 'a']);
  });

  it('returns an empty list unchanged', () => {
    expect(repairParentChain([])).toEqual([]);
  });

  it('does not mutate the input', () => {
    const input = [makeMessage('a', null), makeMessage('b', 'x')];
    const snapshot = JSON.parse(JSON.stringify(input));
    repairParentChain(input);
    expect(input).toEqual(snapshot);
  });
});
