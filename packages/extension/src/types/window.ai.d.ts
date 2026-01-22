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
    maxTemperature: number;
}

export interface AILanguageModelCreateOptions {
  topK?: number;
  temperature?: number;
  initialPrompts?: { role: 'system' | 'user' | 'assistant'; content: string }[];
  signal?: AbortSignal;
}

export interface AILanguageModelSession {
  prompt(text: string): Promise<string>;
  promptStreaming(text: string): Promise<ReadableStream<string> & AsyncIterable<string>>;
  destroy(): void;
  clone(): Promise<AILanguageModelSession>;

  // Stats
  tokensSoFar: number;
  maxTokens: number;
  tokensLeft: number;

  // Cost
  countPromptTokens?(text: string): Promise<number>;
  measureInputUsage?(text: string): Promise<number>;

  // Legacy/Alternate quota props
  inputQuota?: number;
  inputUsage?: number;
}

// Spec API Interface (LanguageModel)
export interface LanguageModelFactory {
  availability(): Promise<'readily' | 'after-download' | 'no'>;
  create(options?: AILanguageModelCreateOptions): Promise<AILanguageModelSession>;
  params(): Promise<AILanguageModelParams>;
}

declare global {
  interface Window {
    ai: {
      languageModel: AILanguageModel;
      prompt?: AILanguageModel; // Legacy alias
    };
    LanguageModel?: LanguageModelFactory;
  }
}
