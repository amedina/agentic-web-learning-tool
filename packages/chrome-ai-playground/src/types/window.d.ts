export interface AILanguageModel {
  capabilities(): Promise<AILanguageModelCapabilities>;
  create(
    options?: AILanguageModelCreateOptions,
  ): Promise<AILanguageModelSession>;
  params(): Promise<AILanguageModelParams>;
}

export interface AILanguageModelCapabilities {
  available: "readily" | "after-download" | "no";
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
  initialPrompts?: { role: "system" | "user" | "assistant"; content: string }[];
  signal?: AbortSignal;
  monitor?: (monitor: any) => void;
  expectedOutputLanguage?: string;
}

export interface AILanguageModelPromptOptions {
  signal?: AbortSignal;
}

export interface AILanguageModelSession {
  prompt(text: string, options?: AILanguageModelPromptOptions): Promise<string>;
  promptStreaming(
    text: string,
    options?: AILanguageModelPromptOptions,
  ): Promise<ReadableStream<string> & AsyncIterable<string>>;
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

export type AIAvailability =
  | "readily"
  | "after-download"
  | "downloadable"
  | "no"
  | "downloading"
  | "available"
  | "unavailable";

// Spec API Interface (LanguageModel)
export interface LanguageModelFactory {
  availability(options?: AILanguageModelCreateOptions): Promise<AIAvailability>;
  create(
    options?: AILanguageModelCreateOptions,
  ): Promise<AILanguageModelSession>;
  params(): Promise<AILanguageModelParams>;
}

// Writer & Rewriter APIs

// Writer Types
export type AIWriterTone = "formal" | "neutral" | "casual";
export type AIWriterLength = "short" | "medium" | "long";
export type AIWriterFormat = "markdown" | "plain-text";

export interface AIWriterCreateOptions {
  tone?: AIWriterTone;
  length?: AIWriterLength;
  format?: AIWriterFormat;
  sharedContext?: string;
  signal?: AbortSignal;
  monitor?: (monitor: any) => void;
}

// Rewriter Types
export type AIRewriterTone = "as-is" | "more-formal" | "more-casual";
export type AIRewriterLength = "as-is" | "shorter" | "longer";
export type AIRewriterFormat = "as-is" | "markdown" | "plain-text";

export interface AIRewriterCreateOptions {
  tone?: AIRewriterTone;
  length?: AIRewriterLength;
  format?: AIRewriterFormat;
  sharedContext?: string;
  signal?: AbortSignal;
  monitor?: (monitor: any) => void;
}

export interface AIWriter {
  writeStreaming(
    prompt: string,
  ): ReadableStream<string> & AsyncIterable<string>;
  write(prompt: string): Promise<string>;
  destroy(): void;
}

export interface AIRewriter {
  rewriteStreaming(
    text: string,
  ): Promise<ReadableStream<string> & AsyncIterable<string>>;
  rewrite(text: string): Promise<string>;
  destroy(): void;
}

export interface AIWriterFactory {
  create(options?: AIWriterCreateOptions): Promise<AIWriter>;
  availability?(): Promise<AIAvailability>;
  capabilities?(): Promise<{ available: AIAvailability }>;
}

export interface AIRewriterFactory {
  create(options?: AIRewriterCreateOptions): Promise<AIRewriter>;
  availability?(): Promise<AIAvailability>;
  capabilities?(): Promise<{ available: AIAvailability }>;
}

// Language Detector API
export interface AILanguageDetector {
  detect(
    text: string,
  ): Promise<{ detectedLanguage: string; confidence: number }[]>;
}

export interface AILanguageDetectorCapabilities {
  available: AIAvailability;
}

export interface AILanguageDetectorFactory {
  create(options?: {
    monitor?: (monitor: any) => void;
  }): Promise<AILanguageDetector>;
  capabilities?(): Promise<AILanguageDetectorCapabilities>;
  availability?(): Promise<AIAvailability>;
}

// Translator API
export interface AITranslatorCreateOptions {
  sourceLanguage: string;
  targetLanguage: string;
  monitor?: (monitor: any) => void;
  signal?: AbortSignal;
}

export interface AITranslator {
  translate(text: string): Promise<string>;
  translateStreaming(
    text: string,
  ): ReadableStream<string> & AsyncIterable<string>;
}

export interface AITranslatorFactory {
  create(options: AITranslatorCreateOptions): Promise<AITranslator>;
  availability(options: {
    sourceLanguage: string;
    targetLanguage: string;
  }): Promise<AIAvailability>;
}

// Summarizer API

export type AISummarizerType = "key-points" | "tldr" | "teaser" | "headline";
export type AISummarizerFormat = "markdown" | "plain-text";
export type AISummarizerLength = "short" | "medium" | "long";

export interface AISummarizerCreateOptions {
  type?: AISummarizerType;
  format?: AISummarizerFormat;
  length?: AISummarizerLength;
  signal?: AbortSignal;
  monitor?: (monitor: any) => void;
}

export interface AISummarizerSession {
  summarize(text: string): Promise<string>;
  summarizeStreaming?(
    text: string,
  ): ReadableStream<string> & AsyncIterable<string>;
  destroy(): void;
  measureInputUsage?(text: string): Promise<number>;

  // Quota props
  inputQuota?: number;
}

export interface AISummarizerFactory {
  create(options?: AISummarizerCreateOptions): Promise<AISummarizerSession>;
  availability?(): Promise<AIAvailability>;
  capabilities?(): Promise<{ available: AIAvailability }>;
}

// Proofreader API

export interface AIProofreaderCreateOptions {
  includeCorrectionTypes?: boolean;
  includeCorrectionExplanations?: boolean;
  expectedInputLanguages?: string[];
  correctionExplanationLanguage?: string;
  signal?: AbortSignal;
  monitor?: (monitor: any) => void;
}

export interface AIProofreaderCorrection {
  startIndex: number;
  endIndex: number;
  type: string;
  correction: string;
  explanation?: string;
}

export interface AIProofreaderResult {
  correctedInput: string;
  corrections: AIProofreaderCorrection[];
}

export interface AIProofreader {
  proofread(text: string): Promise<AIProofreaderResult>;
  destroy(): void;
}

export interface AIProofreaderFactory {
  create(options?: AIProofreaderCreateOptions): Promise<AIProofreader>;
  availability?(): Promise<AIAvailability>;
  capabilities?(): Promise<{ available: AIAvailability }>;
}

declare global {
  interface Window {
    ai: {
      languageModel: AILanguageModel;
      prompt?: AILanguageModel; // Legacy alias
      writer?: AIWriterFactory;
      rewriter?: AIRewriterFactory;
      languageDetector?: AILanguageDetectorFactory;
      translator?: AITranslatorFactory;
      summarizer?: AISummarizerFactory;
      proofreader?: AIProofreaderFactory;
    };
    translation?: AITranslatorFactory;
    LanguageModel?: LanguageModelFactory;
    Writer?: AIWriterFactory;
    Rewriter?: AIRewriterFactory;
    Summarizer?: AISummarizerFactory;
    LanguageDetector?: AILanguageDetectorFactory;
    Translator?: AITranslatorFactory;
    Proofreader?: AIProofreaderFactory;
  }
}
