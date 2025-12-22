/**
 * Internal dependencies
 */
import type { AgentType } from "../../../../types";

export const DEFAULT_FORM_STATE: AgentType = {
    id: '',
    name: '',
    apiKey: '',
    providerUrl: '',
    temperature: 0.7,
    maxTokens: 4096,
    status: true,
    thinkingMode: false,
    extraConfig: '{\n  "top_p": 1,\n  "frequency_penalty": 0\n}',
    model: '',
    modelProvider: '',
    reasoningEffort: "medium",
    reasoningSummary: "auto",
};