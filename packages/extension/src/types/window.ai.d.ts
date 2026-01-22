export interface AILanguageModel {
  capabilities(): Promise<AILanguageModelCapabilities>;
  create(options?: AILanguageModelCreateOptions): Promise<AILanguageModelSession>;
  params(): Promise<AILanguageModelParams>;
}

export interface AILanguageModelCapabilities {
  available: 'readily' | 'after-download' | 'no';
  defaultTopK: number;
  maxTopK: number;
  defaultTemperature: number;
}

export interface AILanguageModelParams {
    defaultTopK: number;
    maxTopK: number;
    defaultTemperature: number;
    maxTemperature: number; // In case it's exposed here
}

export interface AILanguageModelCreateOptions {
  topK?: number;
  temperature?: number;
  initialPrompts?: { role: 'system' | 'user' | 'assistant'; content: string }[];
  signal?: AbortSignal;
}

export interface AILanguageModelSession {
  prompt(text: string): Promise<string>;
  promptStreaming(text: string): Promise<ReadableStream<string>>;
  destroy(): void;
  clone(): Promise<AILanguageModelSession>;

  // Stats - checking both old and new API shapes based on context
  tokensSoFar: number;
  maxTokens: number;
  tokensLeft: number;

  // Method versions for cost
  countPromptTokens?(text: string): Promise<number>;
  measureInputUsage?(text: string): Promise<number>;
}

declare global {
  interface Window {
    ai: {
      languageModel: AILanguageModel;
    };
  }
}
