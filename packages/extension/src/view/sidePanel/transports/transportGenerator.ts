/**
 * External dependencies
 */
import { createOllama } from 'ollama-ai-provider-v2';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
/**
 * Internal dependencies
 */
import { GeminiNanoChatTransport } from "./geminiNano";
import { CloudHostedTransport, type ProviderSettings } from "./cloudHosted";
import logger from '../../../utils/logger';

function transportGenerator(provider = 'browser-ai', model = 'prompt-api', config: ProviderSettings) {
    let modelInstance = null;
    logger(['log'],['Generating transport for provider:', provider, 'model:', model]);
    switch (provider) {
        case 'broswer-ai':
            return new GeminiNanoChatTransport();
        case 'ollama':
            modelInstance = new CloudHostedTransport(model);
            modelInstance.initializeSession(createOllama, config);
            return modelInstance;
        case 'open-ai':
            modelInstance = new CloudHostedTransport(model);
            modelInstance.initializeSession(createOpenAI, config);
            return modelInstance;
        case 'anthropic':
            modelInstance = new CloudHostedTransport(model);
            modelInstance.initializeSession(createAnthropic, config);
            return modelInstance;
        case 'gemini':
            modelInstance = new CloudHostedTransport(model);
            modelInstance.initializeSession(createGoogleGenerativeAI, config);
            return modelInstance;
        default:
            return new GeminiNanoChatTransport();
    }
}

export default transportGenerator;
