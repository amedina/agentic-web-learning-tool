/**
 * External dependencies
 */
import type { SharedV2ProviderOptions } from "@ai-sdk/provider";

function buildProviderOptions(
  modelProvider: string,
): SharedV2ProviderOptions | undefined {
  // Provider-specific reasoning configurations
  switch (modelProvider) {
    case "open-ai": {
      // GPT-5 models support reasoningEffort and reasoningSummary
      const openaiConfig: {
        openai: {
          reasoningEffort: string;
          reasoningSummary?: string;
        };
      } = {
        openai: {
          reasoningEffort: "medium",
          reasoningSummary: "auto",
        },
      };
      return openaiConfig;
    }

    case "gemini": {
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

    default:
      return undefined;
  }
}

export default buildProviderOptions;
