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

// Writer & Rewriter APIs

// Writer Types
export type AIWriterTone = 'formal' | 'neutral' | 'casual';
export type AIWriterLength = 'short' | 'medium' | 'long';
export type AIWriterFormat = 'markdown' | 'plain-text';

export interface AIWriterCreateOptions {
  tone?: AIWriterTone;
  length?: AIWriterLength;
  format?: AIWriterFormat;
  sharedContext?: string;
  signal?: AbortSignal;
}

// Rewriter Types
export type AIRewriterTone = 'as-is' | 'more-formal' | 'more-casual';
export type AIRewriterLength = 'as-is' | 'shorter' | 'longer';
export type AIRewriterFormat = 'as-is' | 'markdown' | 'plain-text';

export interface AIRewriterCreateOptions {
  tone?: AIRewriterTone;
  length?: AIRewriterLength;
  format?: AIRewriterFormat;
  sharedContext?: string;
  signal?: AbortSignal;
}

export interface AIWriter {
  writeStreaming(prompt: string): ReadableStream<string> & AsyncIterable<string>;
  write(prompt: string): Promise<string>;
  destroy(): void;
}

export interface AIRewriter {
  rewriteStreaming(text: string): Promise<ReadableStream<string> & AsyncIterable<string>>;
  rewrite(text: string): Promise<string>;
  destroy(): void;
}

export interface AIWriterFactory {
  create(options?: AIWriterCreateOptions): Promise<AIWriter>;
  availability?(): Promise<'readily' | 'after-download' | 'no'>;
}

export interface AIRewriterFactory {
  create(options?: AIRewriterCreateOptions): Promise<AIRewriter>;
  availability?(): Promise<'readily' | 'after-download' | 'no'>;
}


declare global {
  interface Window {
    ai: {
      languageModel: AILanguageModel;
      prompt?: AILanguageModel; // Legacy alias
      writer?: AIWriterFactory;
      rewriter?: AIRewriterFactory;
    };
    LanguageModel?: LanguageModelFactory;
    Writer?: AIWriterFactory;
    Rewriter?: AIRewriterFactory;
  }
}
