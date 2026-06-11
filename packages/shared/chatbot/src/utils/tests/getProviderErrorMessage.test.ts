/**
 * External dependencies
 */
import { APICallError, LoadAPIKeyError } from 'ai';
/**
 * Internal dependencies
 */
import {
  getProviderErrorMessage,
  getProviderLabel,
} from '../getProviderErrorMessage';

// Replace the AI SDK with minimal error classes so the test does not load the
// real (ESM-only) `ai` package, while still exercising the `isInstance` checks.
jest.mock('ai', () => {
  class APICallError extends Error {
    statusCode?: number;
    responseBody?: string;
    constructor({
      message,
      statusCode,
      responseBody,
    }: {
      message?: string;
      statusCode?: number;
      responseBody?: string;
    }) {
      super(message);
      this.name = 'APICallError';
      this.statusCode = statusCode;
      this.responseBody = responseBody;
    }
    static isInstance(error: unknown): boolean {
      return error instanceof APICallError;
    }
  }

  class LoadAPIKeyError extends Error {
    constructor({ message }: { message?: string } = {}) {
      super(message);
      this.name = 'LoadAPIKeyError';
    }
    static isInstance(error: unknown): boolean {
      return error instanceof LoadAPIKeyError;
    }
  }

  return { APICallError, LoadAPIKeyError };
});

const apiError = (
  statusCode?: number,
  responseBody?: string,
  message = 'request failed'
) =>
  new (APICallError as unknown as new (init: {
    message?: string;
    statusCode?: number;
    responseBody?: string;
  }) => Error)({ message, statusCode, responseBody });

describe('getProviderLabel', () => {
  it('maps known provider ids to readable labels', () => {
    expect(getProviderLabel('anthropic')).toBe('Anthropic');
    expect(getProviderLabel('open-ai')).toBe('OpenAI');
    expect(getProviderLabel('gemini')).toBe('Google Gemini');
    expect(getProviderLabel('browser-ai')).toBe('Browser AI');
  });

  it('falls back to a generic label for unknown providers', () => {
    expect(getProviderLabel(undefined)).toBe('the AI provider');
    expect(getProviderLabel('something-else')).toBe('the AI provider');
  });
});

describe('getProviderErrorMessage', () => {
  it('reports a missing API key', () => {
    const error = new (LoadAPIKeyError as unknown as new () => Error)();
    const message = getProviderErrorMessage(error, 'anthropic');
    expect(message).toContain('No API key found for Anthropic');
    expect(message).toContain('Settings');
  });

  it('reports an unauthorized key for a 401', () => {
    const message = getProviderErrorMessage(apiError(401), 'open-ai');
    expect(message).toContain('OpenAI');
    expect(message).toMatch(/unauthorized/i);
  });

  it('reports denied access for a 403', () => {
    const message = getProviderErrorMessage(apiError(403), 'gemini');
    expect(message).toContain('Google Gemini');
    expect(message).toMatch(/denied access/i);
  });

  it('reports a billing problem for a 402', () => {
    const message = getProviderErrorMessage(apiError(402), 'anthropic');
    expect(message).toMatch(/billing/i);
  });

  it('reports a plain rate limit for a 429 without quota wording', () => {
    const message = getProviderErrorMessage(apiError(429), 'open-ai');
    expect(message).toMatch(/rate limit/i);
    expect(message).not.toMatch(/quota/i);
  });

  it('reports a quota or credit limit for a 429 with quota wording', () => {
    const body = JSON.stringify({
      error: { message: 'You exceeded your current quota' },
    });
    const message = getProviderErrorMessage(apiError(429, body), 'open-ai');
    expect(message).toMatch(/quota or credit limit/i);
    expect(message).toContain('You exceeded your current quota');
  });

  it('reports a missing model for a 404', () => {
    const message = getProviderErrorMessage(apiError(404), 'gemini');
    expect(message).toMatch(/could not find the selected model/i);
  });

  it('reports a server problem for a 5xx', () => {
    const message = getProviderErrorMessage(apiError(503), 'anthropic');
    expect(message).toMatch(/server problems/i);
    expect(message).toContain('503');
  });

  it('includes the provider message parsed from the response body', () => {
    const body = JSON.stringify({ error: { message: 'invalid x-api-key' } });
    const message = getProviderErrorMessage(apiError(401, body), 'anthropic');
    expect(message).toContain('invalid x-api-key');
  });

  it('treats a TypeError as a network failure', () => {
    const message = getProviderErrorMessage(
      new TypeError('Failed to fetch'),
      'open-ai'
    );
    expect(message).toMatch(/could not reach openai/i);
  });

  it('falls back to the raw message for an unknown error', () => {
    const message = getProviderErrorMessage(
      new Error('something odd happened'),
      'gemini'
    );
    expect(message).toContain('something odd happened');
  });

  it('handles a duck-typed API error without the AI SDK class', () => {
    const message = getProviderErrorMessage(
      { statusCode: 429, responseBody: '{}' },
      'open-ai'
    );
    expect(message).toMatch(/rate limit/i);
  });

  it('returns a generic message for a non-error value', () => {
    const message = getProviderErrorMessage(null, 'anthropic');
    expect(message).toMatch(/unexpected error occurred/i);
    expect(message).toContain('Anthropic');
  });
});
