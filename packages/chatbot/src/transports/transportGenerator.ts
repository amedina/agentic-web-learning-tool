/**
 * External dependencies
 */
import { logger } from "@google-awlt/common";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
/**
 * Internal dependencies
 */
import { GeminiNanoChatTransport } from "./geminiNano";
import { CloudHostedTransport, type ProviderSettings } from "./cloudHosted";
import { buildProviderOptions } from "../utils";

function transportGenerator(
  provider = "browser-ai",
  model = "prompt-api",
  config: ProviderSettings,
  thinkingMode = false,
  systemPrompt = "",
) {
  let modelInstance = null;
  logger(
    ["log"],
    ["Generating transport for provider:", provider, "model:", model],
  );
  switch (provider) {
    case "broswer-ai":
      return new GeminiNanoChatTransport();
    case "open-ai":
      modelInstance = new CloudHostedTransport(
        model,
        buildProviderOptions(thinkingMode, provider) ?? {},
        systemPrompt,
      );
      modelInstance.initializeSession(createOpenAI, config);
      return modelInstance;
    case "anthropic":
      modelInstance = new CloudHostedTransport(
        model,
        buildProviderOptions(thinkingMode, provider) ?? {},
        systemPrompt,
      );
      modelInstance.initializeSession(createAnthropic, config);
      return modelInstance;
    case "gemini":
      modelInstance = new CloudHostedTransport(
        model,
        buildProviderOptions(thinkingMode, provider) ?? {},
        systemPrompt,
      );
      modelInstance.initializeSession(createGoogleGenerativeAI, config);
      return modelInstance;
    default:
      return new GeminiNanoChatTransport();
  }
}

export default transportGenerator;
