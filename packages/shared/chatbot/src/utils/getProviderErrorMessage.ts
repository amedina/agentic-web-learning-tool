/**
 * External dependencies
 */
import { APICallError, LoadAPIKeyError } from 'ai';

type ApiErrorShape = {
  statusCode?: number;
  responseBody?: string;
  message?: string;
};

/**
 * Maps an internal model-provider id to a human-readable label used in
 * user-facing error notifications.
 */
export const getProviderLabel = (provider?: string): string => {
  switch (provider) {
    case 'anthropic':
      return 'Anthropic';
    case 'open-ai':
      return 'OpenAI';
    case 'gemini':
      return 'Google Gemini';
    case 'browser-ai':
      return 'Browser AI';
    default:
      return 'the AI provider';
  }
};

/**
 * Normalizes an unknown error into the subset of API-call fields this module
 * cares about. Recognizes the AI SDK `APICallError` as well as any duck-typed
 * error that carries a `statusCode`/`responseBody`, so wrapped provider errors
 * are still understood.
 * @param error - The thrown value.
 * @returns The extracted API error fields, or null if the error is not an API call error.
 */
const asApiError = (error: unknown): ApiErrorShape | null => {
  if (APICallError.isInstance(error)) {
    return {
      statusCode: error.statusCode,
      responseBody: error.responseBody,
      message: error.message,
    };
  }
  if (
    error &&
    typeof error === 'object' &&
    ('statusCode' in error || 'responseBody' in error)
  ) {
    const candidate = error as Record<string, unknown>;
    return {
      statusCode:
        typeof candidate.statusCode === 'number'
          ? candidate.statusCode
          : undefined,
      responseBody:
        typeof candidate.responseBody === 'string'
          ? candidate.responseBody
          : undefined,
      message:
        typeof candidate.message === 'string' ? candidate.message : undefined,
    };
  }
  return null;
};

/**
 * Attempts to pull the provider's own human-readable error message out of an
 * API error response body, which is usually JSON shaped like
 * `{ "error": { "message": "..." } }`.
 * @param responseBody - The raw response body string from the failed call.
 * @returns The provider message if one could be parsed, otherwise undefined.
 */
const extractResponseMessage = (responseBody?: string): string | undefined => {
  if (!responseBody) {
    return undefined;
  }
  try {
    const parsed = JSON.parse(responseBody);
    const message = parsed?.error?.message ?? parsed?.message;
    if (typeof message === 'string' && message.trim()) {
      return message.trim();
    }
  } catch {
    // Body was not JSON; fall through and let the caller use the status code.
  }
  return undefined;
};

/**
 * Translates an error thrown while talking to an LLM provider into a short,
 * user-friendly explanation that can be shown in a toast and in the chat.
 * Covers the common failure modes (missing or invalid API key, rate-limit and
 * quota exhaustion, billing, model-not-found, provider outages, and network
 * errors) and falls back to the raw error message when the cause is unknown.
 * @param error - The thrown value to translate.
 * @param provider - The internal model-provider id, used to name the provider.
 * @returns A user-facing message describing what went wrong.
 */
export const getProviderErrorMessage = (
  error: unknown,
  provider?: string
): string => {
  const label = getProviderLabel(provider);

  if (LoadAPIKeyError.isInstance(error)) {
    return `No API key found for ${label}. Add a valid API key in Settings to use Ask AI.`;
  }

  const apiError = asApiError(error);
  if (apiError) {
    const providerMessage = extractResponseMessage(apiError.responseBody);
    const status = apiError.statusCode;
    const suffix = providerMessage ? ` (${providerMessage})` : '';

    if (status === 401) {
      return `${label} rejected your API key (unauthorized). Check that the key is correct and active in Settings.${suffix}`;
    }
    if (status === 403) {
      return `${label} denied access with your API key. It may lack permission for this model or region.${suffix}`;
    }
    if (status === 402) {
      return `${label} reported a billing problem. Check your plan and payment details, then try again.${suffix}`;
    }
    if (status === 429) {
      const haystack = `${providerMessage ?? ''} ${apiError.responseBody ?? ''}`;
      const isQuota = /quota|insufficient|credit|billing|exceeded your/i.test(
        haystack
      );
      if (isQuota) {
        return `Your ${label} quota or credit limit has been reached. Check your plan and billing, then try again.${suffix}`;
      }
      return `${label} rate limit reached. Please wait a moment and try again.${suffix}`;
    }
    if (status === 404) {
      return `${label} could not find the selected model. Pick a different model in Settings.${suffix}`;
    }
    if (typeof status === 'number' && status >= 500) {
      return `${label} is having server problems (error ${status}). Please try again later.${suffix}`;
    }
    if (providerMessage) {
      return `${label} request failed: ${providerMessage}`;
    }
    return `${label} request failed${typeof status === 'number' ? ` (error ${status})` : ''}: ${
      apiError.message ?? 'unknown error'
    }`;
  }

  // Network-level failures (offline, DNS, CORS) usually surface as TypeError.
  if (
    error instanceof TypeError ||
    (error instanceof Error && /fetch|network|connection/i.test(error.message))
  ) {
    return `Could not reach ${label}. Check your internet connection and try again.`;
  }

  if (error instanceof Error && error.message.trim()) {
    return `${label} request failed: ${error.message}`;
  }

  return `An unexpected error occurred while contacting ${label}. Please try again.`;
};
