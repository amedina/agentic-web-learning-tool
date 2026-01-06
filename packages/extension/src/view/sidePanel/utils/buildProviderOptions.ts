/**
 * External dependencies
 */
import type { SharedV2ProviderOptions } from "@ai-sdk/provider";

function buildProviderOptions(
    thinkingMode: boolean,
    modelProvider: string
): SharedV2ProviderOptions | undefined {
    if (!thinkingMode) {
        return undefined;
    }
    // Provider-specific reasoning configurations
    switch (modelProvider) {
        case 'anthropic':
            // Claude 4 models support thinking with budgetTokens
            return {
                anthropic: {
                    thinking: {
                        type: 'enabled',
                        budgetTokens: 12000,
                    },
                },
            };

        case 'openai': {
            // GPT-5 models support reasoningEffort and reasoningSummary
            const openaiConfig: {
                openai: {
                    reasoningEffort: string;
                    reasoningSummary?: string;
                };
            } = {
                openai: {
                    reasoningEffort: 'medium',
                    reasoningSummary: 'auto'
                },
            };
            return openaiConfig;
        }

        case 'google': {
            // Gemini 2.5 models support thinkingConfig
            return {
                google: {
                    thinkingConfig: {
                        thinkingBudget: 8192,
                        includeThoughts: true,
                    },
                },
            };
        }

        case 'ollama':
            return {
                ollama: {
                    think: true
                }
            }

        default:
            return undefined;
    }
}

export default buildProviderOptions;
