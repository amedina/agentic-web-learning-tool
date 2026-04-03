/**
 * External dependencies
 */
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
/**
 * Internal dependencies
 */
import { CloudHostedTransport, type ProviderSettings } from "./cloudHosted";
import buildProviderOptions from "./buildProviderOptions";

function transportGenerator(
  provider = "gemini",
  model = "gemini-pro-latest",
  config: ProviderSettings,
  systemPrompt = "",
) {
  let modelInstance = null;
  console.log("Generating transport for provider:", provider, "model:", model);
  switch (provider) {
    case "open-ai":
      modelInstance = new CloudHostedTransport(
        model,
        buildProviderOptions(provider) ?? {},
        systemPrompt,
      );
      modelInstance.initializeSession(createOpenAI, config);
      return modelInstance;
    case "gemini":
      modelInstance = new CloudHostedTransport(
        model,
        buildProviderOptions(provider) ?? {},
        systemPrompt,
      );
      modelInstance.initializeSession(createGoogleGenerativeAI, config);
      return modelInstance;
    default:
      modelInstance = new CloudHostedTransport(
        model,
        buildProviderOptions(provider) ?? {},
        systemPrompt,
      );
      modelInstance.initializeSession(createGoogleGenerativeAI, config);
      return modelInstance;
  }
}

export default transportGenerator;
