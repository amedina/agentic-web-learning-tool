import { z } from 'zod';
import { NodeType } from '../types';

/**
 * Workflow metadata schema
 */
export const WorkflowMetaSchema = z
  .object({
    id: z.string(),
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    savedAt: z.string(),
    allowedDomains: z.array(z.string()).optional(),
    isWebMCP: z.boolean().optional(),
    enabled: z.boolean().optional(),
    autosave: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.isWebMCP) {
      if (!data.allowedDomains?.length) {
        ctx.addIssue({
          code: 'too_small',
          message: 'Allowed domains are required for WebMCP workflows',
          origin: 'array',
          minimum: 1,
        });
      }

      if (!data.description) {
        ctx.addIssue({
          code: 'too_small',
          message: 'Description is required for WebMCP workflows',
          origin: 'string',
          minimum: 1,
        });
      }
    }
  });

/**
 * Node UI configuration schema
 */
export const NodeUIConfigSchema = z.object({
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
});

/**
 * Edge connection schema
 */
export const EdgeConfigSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().nullable().optional(),
  targetHandle: z.string().nullable().optional(),
});

/**
 * Specific node configuration schemas
 */

export const PromptApiConfigSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  context: z.string().min(1, 'Context is required'),
  topK: z.number().min(1).max(128),
  temperature: z.number().min(0).max(2),
  expectedInputsLanguages: z.array(z.enum(['en', 'es', 'ja'])),
  expectedOutputsLanguages: z.array(z.enum(['en', 'es', 'ja'])),
  initialPrompts: z.array(
    z.object({
      role: z.enum(['system', 'user', 'assistant']),
      content: z.string(),
    })
  ),
});

export const WriterApiConfigSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  context: z.string().min(1, 'Context is required'),
  tone: z.enum(['formal', 'neutral', 'casual']),
  format: z.enum(['markdown', 'plain-text']),
  length: z.enum(['short', 'medium', 'long']),
  expectedInputLanguages: z.array(z.enum(['en', 'ja', 'es'])),
  outputLanguage: z.enum(['en', 'ja', 'es']),
});

export const RewriterApiConfigSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  context: z.string().min(1, 'Context is required'),
  tone: z.enum(['more-formal', 'as-is', 'more-casual']),
  format: z.enum(['as-is', 'markdown', 'plain-text']),
  length: z.enum(['shorter', 'as-is', 'longer']),
  expectedInputLanguages: z.array(z.enum(['en', 'ja', 'es'])),
  outputLanguage: z.enum(['en', 'ja', 'es']),
});

export const ProofreaderApiConfigSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  expectedInputLanguages: z.array(z.enum(['en', 'ja', 'es'])),
});

export const TranslatorApiConfigSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  sourceLanguage: z.enum(['en', 'ja', 'es']),
  targetLanguage: z.enum(['en', 'ja', 'es']),
});

export const LanguageDetectorApiConfigSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
});

export const SummarizerApiConfigSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  context: z.string().min(1, 'Context is required'),
  type: z.enum(['key-points', 'tldr', 'teaser', 'headline']),
  format: z.enum(['markdown', 'plain-text']),
  length: z.enum(['short', 'medium', 'long']),
  expectedInputLanguages: z.array(z.enum(['en', 'ja', 'es'])),
  outputLanguage: z.enum(['en', 'ja', 'es']),
});

export const DomInputConfigSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  cssSelector: z.string().min(1, 'CSS Selector is required'),
  extract: z.enum([
    'textContent',
    'innerText',
    'innerHTML',
    'value',
    'src',
    'href',
  ]),
  defaultValue: z.string(),
  isMultiple: z.boolean().optional(),
});

export const StaticInputConfigSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  inputValue: z.string().min(1, 'Input value is required'),
  isMultiple: z.boolean().optional(),
});

export const ConditionConfigSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  comparisonType: z.enum([
    'equals',
    'not_equals',
    'contains',
    'not_contains',
    'starts_with',
    'ends_with',
    'greater_than',
    'less_than',
    'greater_equal',
    'less_equal',
  ]),
  comparisonValue: z.string().min(1, 'Comparison value is required'),
});

export const MathConfigSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  operation: z.enum([
    'add',
    'subtract',
    'multiply',
    'divide',
    'power',
    'root',
    'round',
    'floor',
    'ceil',
    'abs',
  ]),
  operand: z.string().optional(), // Second operand for binary operations
});

export const LoopConfigSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
});

export const DataTransformerConfigSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  operation: z.enum([
    'regex',
    'jsonParse',
    'format',
    'split',
    'join',
    'template',
    'filter',
    'map',
    'objectKeys',
    'objectValues',
  ]),
  pattern: z.string().optional(),
  flags: z.string().optional(),
  path: z.string().optional(),
  formatType: z.enum(['lowercase', 'uppercase', 'trim', 'length']).optional(),
  separator: z.string().optional(),
  index: z.string().optional(),
  template: z.string().optional(),
  filterKey: z.string().optional(),
  filterValue: z.string().optional(),
  mapPath: z.string().optional(),
});

export const AlertNotificationConfigSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  useCustomMessage: z.boolean().optional(),
  message: z.string().optional(),
});

export const DomReplacementConfigSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  selector: z.string().min(1, 'Selector is required'),
  isMultiple: z.boolean().optional(),
  mode: z.enum(['textContent', 'innerText', 'innerHTML', 'value']).optional(),
});

export const ClipboardWriterConfigSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
});

export const FileCreatorConfigSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  filename: z.string(),
});

export const TextToSpeechConfigSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
});

export const TooltipConfigSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  selector: z.string().min(1, 'Selector is required'),
});

export const StartEndConfigSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
});

/**
 * Node configuration schema (discriminated union)
 */
export const NodeConfigSchema = z.discriminatedUnion('type', [
  z.object({
    id: z.string(),
    type: z.literal(NodeType.PROMPT_API),
    ui: NodeUIConfigSchema.optional(),
    config: PromptApiConfigSchema,
    label: z.string(),
  }),
  z.object({
    id: z.string(),
    type: z.literal(NodeType.WRITER_API),
    ui: NodeUIConfigSchema.optional(),
    config: WriterApiConfigSchema,
    label: z.string(),
  }),
  z.object({
    id: z.string(),
    type: z.literal(NodeType.REWRITER_API),
    ui: NodeUIConfigSchema.optional(),
    config: RewriterApiConfigSchema,
    label: z.string(),
  }),
  z.object({
    id: z.string(),
    type: z.literal(NodeType.PROOFREADER_API),
    ui: NodeUIConfigSchema.optional(),
    config: ProofreaderApiConfigSchema,
    label: z.string(),
  }),
  z.object({
    id: z.string(),
    type: z.literal(NodeType.TRANSLATOR_API),
    ui: NodeUIConfigSchema.optional(),
    config: TranslatorApiConfigSchema,
    label: z.string(),
  }),
  z.object({
    id: z.string(),
    type: z.literal(NodeType.LANGUAGE_DETECTOR_API),
    ui: NodeUIConfigSchema.optional(),
    config: LanguageDetectorApiConfigSchema,
    label: z.string(),
  }),
  z.object({
    id: z.string(),
    type: z.literal(NodeType.SUMMARIZER_API),
    ui: NodeUIConfigSchema.optional(),
    config: SummarizerApiConfigSchema,
    label: z.string(),
  }),
  z.object({
    id: z.string(),
    type: z.literal(NodeType.DOM_INPUT),
    ui: NodeUIConfigSchema.optional(),
    config: DomInputConfigSchema,
    label: z.string(),
  }),
  z.object({
    id: z.string(),
    type: z.literal(NodeType.STATIC_INPUT),
    ui: NodeUIConfigSchema.optional(),
    config: StaticInputConfigSchema,
    label: z.string(),
  }),
  z.object({
    id: z.string(),
    type: z.literal(NodeType.CONDITION),
    ui: NodeUIConfigSchema.optional(),
    config: ConditionConfigSchema,
    label: z.string(),
  }),
  z.object({
    id: z.string(),
    type: z.literal(NodeType.MATH),
    ui: NodeUIConfigSchema.optional(),
    config: MathConfigSchema,
    label: z.string(),
  }),
  z.object({
    id: z.string(),
    type: z.literal(NodeType.LOOP),
    ui: NodeUIConfigSchema.optional(),
    config: LoopConfigSchema,
    label: z.string(),
  }),
  z.object({
    id: z.string(),
    type: z.literal(NodeType.DATA_TRANSFORMER),
    ui: NodeUIConfigSchema.optional(),
    config: DataTransformerConfigSchema,
    label: z.string(),
  }),
  z.object({
    id: z.string(),
    type: z.literal(NodeType.ALERT_NOTIFICATION),
    ui: NodeUIConfigSchema.optional(),
    config: AlertNotificationConfigSchema,
    label: z.string(),
  }),
  z.object({
    id: z.string(),
    type: z.literal(NodeType.DOM_REPLACEMENT),
    ui: NodeUIConfigSchema.optional(),
    config: DomReplacementConfigSchema,
    label: z.string(),
  }),
  z.object({
    id: z.string(),
    type: z.literal(NodeType.CLIPBOARD_WRITER),
    ui: NodeUIConfigSchema.optional(),
    config: ClipboardWriterConfigSchema,
    label: z.string(),
  }),
  z.object({
    id: z.string(),
    type: z.literal(NodeType.FILE_CREATOR),
    ui: NodeUIConfigSchema.optional(),
    config: FileCreatorConfigSchema,
    label: z.string(),
  }),
  z.object({
    id: z.string(),
    type: z.literal(NodeType.TEXT_TO_SPEECH),
    ui: NodeUIConfigSchema.optional(),
    config: TextToSpeechConfigSchema,
    label: z.string(),
  }),
  z.object({
    id: z.string(),
    type: z.literal(NodeType.TOOLTIP),
    ui: NodeUIConfigSchema.optional(),
    config: TooltipConfigSchema,
    label: z.string(),
  }),
  z.object({
    id: z.string(),
    type: z.literal(NodeType.START),
    ui: NodeUIConfigSchema.optional(),
    config: StartEndConfigSchema,
    label: z.string(),
  }),
  z.object({
    id: z.string(),
    type: z.literal(NodeType.END),
    ui: NodeUIConfigSchema.optional(),
    config: StartEndConfigSchema,
    label: z.string(),
  }),
]);

/**
 * Workflow graph schema
 */
export const WorkflowGraphSchema = z.object({
  nodes: z.array(NodeConfigSchema),
  edges: z.array(EdgeConfigSchema),
});

/**
 * Root Workflow JSON schema
 */
export const WorkflowJSONSchema = z.object({
  meta: WorkflowMetaSchema,
  graph: WorkflowGraphSchema,
});
