/**
 * External dependencies
 */
import { logger } from '@agentic-web-labs/common';
import { createOpenAI } from '@ai-sdk/openai';
import {
  createAnthropic,
  type AnthropicProviderSettings,
} from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
/**
 * Internal dependencies
 */
import { GeminiNanoChatTransport } from './geminiNano';
import { CloudHostedTransport, type ProviderSettings } from './cloudHosted';
import { buildProviderOptions } from '../utils';

function transportGenerator(
  provider = 'browser-ai',
  model = 'prompt-api',
  config: ProviderSettings,
  thinkingMode = false,
  systemPrompt = '',
  isNPMAdivsor = false
) {
  let modelInstance = null;
  logger(
    ['log'],
    ['Generating transport for provider:', provider, 'model:', model]
  );
  switch (provider) {
    case 'broswer-ai':
      return new GeminiNanoChatTransport();
    case 'open-ai':
      modelInstance = new CloudHostedTransport(
        model,
        buildProviderOptions(thinkingMode, provider) ?? {},
        systemPrompt
      );
      modelInstance.initializeSession(createOpenAI, config, isNPMAdivsor);
      return modelInstance;
    case 'anthropic': {
      modelInstance = new CloudHostedTransport(
        model,
        buildProviderOptions(thinkingMode, provider) ?? {},
        systemPrompt
      );
      // Anthropic rejects browser-origin requests (such as those from the
      // extension side panel) unless this header is set. The user supplies
      // their own key, stored client-side, so direct browser access is the
      // intended usage here.
      const anthropicConfig: AnthropicProviderSettings = {
        ...(config as AnthropicProviderSettings),
        headers: {
          ...(config as AnthropicProviderSettings).headers,
          'anthropic-dangerous-direct-browser-access': 'true',
        },
      };
      modelInstance.initializeSession(
        createAnthropic,
        anthropicConfig,
        isNPMAdivsor
      );
      return modelInstance;
    }
    case 'gemini':
      modelInstance = new CloudHostedTransport(
        model,
        buildProviderOptions(thinkingMode, provider) ?? {},
        systemPrompt
      );
      modelInstance.initializeSession(
        createGoogleGenerativeAI,
        config,
        isNPMAdivsor
      );
      return modelInstance;
    default:
      return new GeminiNanoChatTransport();
  }
}

export default transportGenerator;
