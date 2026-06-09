/**
 * External dependencies
 */
import { type UIMessageStreamWriter } from 'ai';
import { toast } from '@agentic-web-labs/design-system';
import { logger } from '@agentic-web-labs/common';
/**
 * Internal dependencies
 */
import { getProviderErrorMessage } from './getProviderErrorMessage';

/**
 * Determines whether an error is the result of the user cancelling the request
 * (an aborted fetch), which should not be reported as a provider failure.
 * @param error - The thrown value.
 * @returns True if the error represents an aborted request.
 */
const isAbortError = (error: unknown): boolean => {
  return (
    error instanceof Error &&
    (error.name === 'AbortError' || /\baborted\b/i.test(error.message))
  );
};

/**
 * Builds a one-shot error surfacer bound to a UI message stream writer.
 *
 * The returned function turns a provider error into a friendly message, logs
 * it, shows an error toast so the user is notified immediately, and writes the
 * message into the chat stream so it is also visible inline. It acts at most
 * once per stream: the AI SDK can report the same failure through more than one
 * callback, and deduping keeps the user from seeing repeated notifications.
 * @param writer - The UI message stream writer for the active request.
 * @param provider - The internal model-provider id, used to name the provider.
 * @returns A function that surfaces an error, with an optional message override.
 */
export const createTransportErrorSurfacer = (
  writer: UIMessageStreamWriter,
  provider?: string
) => {
  let hasSurfaced = false;

  /**
   * Surfaces a single provider error via toast and the chat stream.
   * @param error - The thrown value, used for logging and message derivation.
   * @param explicitMessage - A ready-made message that overrides the derived one.
   */
  return (error: unknown, explicitMessage?: string): void => {
    if (hasSurfaced) {
      return;
    }
    if (!explicitMessage && isAbortError(error)) {
      return;
    }
    hasSurfaced = true;

    const message = explicitMessage ?? getProviderErrorMessage(error, provider);
    logger(['error'], ['Ask AI provider error:', error]);
    toast.error(message);

    const id = crypto.randomUUID();
    writer.write({ type: 'text-start', id });
    writer.write({ type: 'text-delta', delta: message, id });
    writer.write({ type: 'text-end', id });
  };
};
