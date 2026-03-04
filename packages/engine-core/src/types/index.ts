import z from 'zod';
import {
  EdgeConfigSchema,
  NodeConfigSchema,
  NodeUIConfigSchema,
  WorkflowGraphSchema,
  WorkflowJSONSchema,
  WorkflowMetaSchema,
  LanguageDetectorApiConfigSchema,
  PromptApiConfigSchema,
  WriterApiConfigSchema,
  RewriterApiConfigSchema,
  ProofreaderApiConfigSchema,
  TranslatorApiConfigSchema,
  SummarizerApiConfigSchema,
  DomInputConfigSchema,
  StaticInputConfigSchema,
  ConditionConfigSchema,
  MathConfigSchema,
  LoopConfigSchema,
  DataTransformerConfigSchema,
  AlertNotificationConfigSchema,
  DomReplacementConfigSchema,
  ClipboardWriterConfigSchema,
  FileCreatorConfigSchema,
  TextToSpeechConfigSchema,
  TooltipConfigSchema,
  StartEndConfigSchema,
  SelectionToolConfigSchema,
} from '../validation/workflow';

/**
 * Workflow JSON structure (serialized from UI)
 */
export type WorkflowJSON = z.infer<typeof WorkflowJSONSchema>;

/**
 * Workflow metadata
 */
export type WorkflowMeta = z.infer<typeof WorkflowMetaSchema>;

/**
 * Workflow graph containing nodes and edges
 */
export type WorkflowGraph = z.infer<typeof WorkflowGraphSchema>;

/**
 * Supported node types in the workflow
 */
export enum NodeType {
  PROMPT_API = 'promptApi',
  WRITER_API = 'writerApi',
  REWRITER_API = 'rewriterApi',
  PROOFREADER_API = 'proofreaderApi',
  TRANSLATOR_API = 'translatorApi',
  LANGUAGE_DETECTOR_API = 'languageDetectorApi',
  SUMMARIZER_API = 'summarizerApi',
  DOM_INPUT = 'domInput',
  STATIC_INPUT = 'staticInput',
  CONDITION = 'condition',
  MATH = 'math',
  LOOP = 'loop',
  DATA_TRANSFORMER = 'dataTransformer',
  ALERT_NOTIFICATION = 'alertNotification',
  DOM_REPLACEMENT = 'domReplacement',
  CLIPBOARD_WRITER = 'clipboardWriter',
  FILE_CREATOR = 'fileCreator',
  TEXT_TO_SPEECH = 'textToSpeech',
  TOOLTIP = 'tooltip',
  SELECTION_TOOL = 'selectionTool',
  START = 'start',
  END = 'end',
}

export type LanguageDetectorApiConfig = z.infer<
  typeof LanguageDetectorApiConfigSchema
>;

export type PromptApiConfig = z.infer<typeof PromptApiConfigSchema>;

export type WriterApiConfig = z.infer<typeof WriterApiConfigSchema>;

export type RewriterApiConfig = z.infer<typeof RewriterApiConfigSchema>;

export type ProofreaderApiConfig = z.infer<typeof ProofreaderApiConfigSchema>;

export type TranslatorApiConfig = z.infer<typeof TranslatorApiConfigSchema>;

export type SummarizerApiConfig = z.infer<typeof SummarizerApiConfigSchema>;

export type DomInputConfig = z.infer<typeof DomInputConfigSchema>;

export type StaticInputConfig = z.infer<typeof StaticInputConfigSchema>;

export type ConditionConfig = z.infer<typeof ConditionConfigSchema>;

export type MathConfig = z.infer<typeof MathConfigSchema>;

export type LoopConfig = z.infer<typeof LoopConfigSchema>;

export type DataTransformerConfig = z.infer<typeof DataTransformerConfigSchema>;

export type AlertNotificationConfig = z.infer<
  typeof AlertNotificationConfigSchema
>;

export type DomReplacementConfig = z.infer<typeof DomReplacementConfigSchema>;

export type ClipboardWriterConfig = z.infer<typeof ClipboardWriterConfigSchema>;

export type FileCreatorConfig = z.infer<typeof FileCreatorConfigSchema>;

export type TextToSpeechConfig = z.infer<typeof TextToSpeechConfigSchema>;

export type TooltipConfig = z.infer<typeof TooltipConfigSchema>;

export type SelectionToolConfig = z.infer<typeof SelectionToolConfigSchema>;

export type StartEndConfig = z.infer<typeof StartEndConfigSchema>;

/**
 * Node configuration in the graph
 */
export type NodeConfig = z.infer<typeof NodeConfigSchema>;

/**
 * UI-specific node configuration
 */
export type NodeUIConfig = z.infer<typeof NodeUIConfigSchema>;

/**
 * Edge connection between nodes
 */
export type EdgeConfig = z.infer<typeof EdgeConfigSchema>;

/**
 * Output produced by a node after execution
 */
export interface NodeOutput {
  status: NodeStatus;
  data?: unknown;
  error?: string;
  metadata?: {
    type: string;
    label?: string;
    config?: Record<string, unknown>;
  };
}

/**
 * Possible node execution statuses
 */
export type NodeStatus =
  | 'pending'
  | 'running'
  | 'success'
  | 'error'
  | 'skipped';

/**
 * Execution context maintained during workflow run
 */
export interface ExecutionContext {
  workflowId: string;
  steps: Record<string, NodeOutput>;
  variables: Record<string, unknown>;
  status: ExecutionStatus;
  signal?: AbortSignal;
  loop?: {
    index: number;
    total: number;
  };
}

/**
 * Possible workflow execution statuses
 */
export type ExecutionStatus = 'idle' | 'running' | 'completed' | 'failed';
