/**
 * Internal dependencies
 */
import type { AgentType } from "@/types";

const DEFAULT_AGENTS: AgentType[] = [
    {
        id: 'browser-ai-default',
        name: 'Broswer AI Default',
        modelProvider: 'browser-ai',
        model: 'prompt-api',
        status: true,
        temperature: 3,
        apiKey: '',
        providerUrl: '',
        maxTokens: 4096,
        thinkingMode: false,
        extraConfig: '',
        reasoningEffort: '',
        reasoningSummary: ''
    },
];

export const onInstalledCallback = async ({ reason }: chrome.runtime.InstalledDetails) => {
    if(reason === 'install'){
        await chrome.storage.sync.set({ agents: DEFAULT_AGENTS });
    }

};