/**
 * Internal dependencies
 */
import type { AgentType } from "../../../../types";

export const DEFAULT_FORM_STATE: AgentType = {
    id: '',
    name: '',
    apiKey: '',
    providerUrl: '',
    temperature: 0.0,
    maxTokens: 4096,
    status: true,
    thinkingMode: false,
    extraConfig: '',
    model: '',
    modelProvider: '',
    reasoningEffort: "medium",
    reasoningSummary: "auto",
};
