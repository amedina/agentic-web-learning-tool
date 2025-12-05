/**
 * Internal dependencies
 */
import { GeminiNanoChatTransport } from "./geminiNano";
import { OllamaTransport } from "./ollama";

function transportGenerator(provider = 'browser-ai', model = 'prompt-api'){
    switch(provider){
        case 'broswer-ai':
            return new GeminiNanoChatTransport();
        case 'ollama':
            return new OllamaTransport(model);
        default:
            return new GeminiNanoChatTransport();
    }
}

export default transportGenerator;