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
import { CloudHostedTrapsort, type ProviderSettings } from "./cloudHosted";

function transportGenerator(provider = 'browser-ai', model = 'prompt-api', config: ProviderSettings){
    let modelInstance = null;
    switch(provider){
        case 'broswer-ai':
            return new GeminiNanoChatTransport();
        case 'ollama':
            modelInstance = new CloudHostedTrapsort(model);
            modelInstance.initializeSession(createOllama, config);
            return modelInstance;
        case 'openai':
            modelInstance = new CloudHostedTrapsort(model);
            modelInstance.initializeSession(createOpenAI, config);
            return modelInstance;
        case 'anthropic':
            modelInstance = new CloudHostedTrapsort(model);
            modelInstance.initializeSession(createAnthropic, config);
            return modelInstance;
        case 'gemini':
            modelInstance = new CloudHostedTrapsort(model);
            modelInstance.initializeSession(createGoogleGenerativeAI, config);
            return modelInstance;
        default:
            return new GeminiNanoChatTransport();
    }
}

export default transportGenerator;