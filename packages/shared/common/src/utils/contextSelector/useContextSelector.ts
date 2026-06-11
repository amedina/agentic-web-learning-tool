/**
 * External dependencies
 */
import {
  useContextSelector as useContextSelectorOrig,
  type Context,
} from 'use-context-selector';
import { useRef, type RefObject } from 'react';

/**
 * Internal dependencies
 */
import { shallowEqual } from './shallowEqual';

interface EqualityFn {
  (a: unknown, b: unknown): boolean;
}

/**
 * This hook returns a part of the context value by selector.
 * It will trigger a re-render only if the selected value has changed.
 *
 * By default, a shallow equals of the selected context value is used to
 * determine if a re-render is needed.
 * @param context Context.
 * @param selector Returns a fragment of the context
 * that the consumer is interested in.
 * @param equalityFn Used to compare the
 * selected context value. If the context fragment has not changed, a re-render
 * will not be triggered. This is {shallowEqual} by default.
 * @returns The selected context value fragment.
 */
function useContextSelector<T, S>(
  context: Context<T>,
  selector: (value: T) => S,
  equalityFn: EqualityFn = shallowEqual
) {
  const ref: RefObject<S | undefined> = useRef(undefined);

  const equalityFnCallback = (state: T) => {
    const selected = selector(state);
    if (ref.current && equalityFn(ref.current, selected)) {
      return ref.current;
    }
    ref.current = selected;
    return selected;
  };

  // Update the selector fn to memoize the selected value by [equalityFn].
  return useContextSelectorOrig(context, equalityFnCallback);
}

export default useContextSelector;
