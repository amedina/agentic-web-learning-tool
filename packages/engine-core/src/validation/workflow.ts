import { z } from 'zod/mini';
import { NodeType } from '../types';

/**
 * Workflow metadata schema
 */
export const WorkflowMetaSchema = z
  .object({
    id: z.string(),
    name: z.string().check(z.minLength(1, 'Name is required')),
    sanitizedName: z.string(),
    description: z.optional(z.string()),
    savedAt: z.string(),
    allowedDomains: z.optional(z.array(z.string())),
    isWebMCP: z.optional(z.boolean()),
    enabled: z.optional(z.boolean()),
    autosave: z.optional(z.boolean()),
  })
  .check(
    z.superRefine((data, ctx) => {
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
    })
  );

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
  sourceHandle: z.nullable(z.optional(z.string())),
  targetHandle: z.nullable(z.optional(z.string())),
});

/**
 * Specific node configuration schemas
 */

export const PromptApiConfigSchema = z.object({
  title: z.string().check(z.minLength(1, 'Title is required')),
  context: z.string().check(z.minLength(1, 'Context is required')),
  topK: z.number().check(z.minimum(1), z.maximum(128)),
  temperature: z.number().check(z.minimum(0)).check(z.maximum(2)),
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
  title: z.string().check(z.minLength(1, 'Title is required')),
  context: z.string().check(z.minLength(1, 'Context is required')),
  tone: z.enum(['formal', 'neutral', 'casual']),
  format: z.enum(['markdown', 'plain-text']),
  length: z.enum(['short', 'medium', 'long']),
  expectedInputLanguages: z.array(z.enum(['en', 'ja', 'es'])),
  outputLanguage: z.enum(['en', 'ja', 'es']),
});

export const RewriterApiConfigSchema = z.object({
  title: z.string().check(z.minLength(1, 'Title is required')),
  context: z.string().check(z.minLength(1, 'Context is required')),
  tone: z.enum(['more-formal', 'as-is', 'more-casual']),
  format: z.enum(['as-is', 'markdown', 'plain-text']),
  length: z.enum(['shorter', 'as-is', 'longer']),
  expectedInputLanguages: z.array(z.enum(['en', 'ja', 'es'])),
  outputLanguage: z.enum(['en', 'ja', 'es']),
});

export const ProofreaderApiConfigSchema = z.object({
  title: z.string().check(z.minLength(1, 'Title is required')),
  description: z.optional(z.string()),
  expectedInputLanguage: z.enum(['en', 'ja', 'es']),
});

export const TranslatorApiConfigSchema = z.object({
  title: z.string().check(z.minLength(1, 'Title is required')),
  description: z.optional(z.string()),
  sourceLanguage: z.enum(['en', 'ja', 'es']),
  targetLanguage: z.enum(['en', 'ja', 'es']),
});

export const LanguageDetectorApiConfigSchema = z.object({
  title: z.string().check(z.minLength(1, 'Title is required')),
  description: z.optional(z.string()),
});

export const SummarizerApiConfigSchema = z.object({
  title: z.string().check(z.minLength(1, 'Title is required')),
  context: z.string().check(z.minLength(1, 'Context is required')),
  type: z.enum(['key-points', 'tldr', 'teaser', 'headline']),
  format: z.enum(['markdown', 'plain-text']),
  length: z.enum(['short', 'medium', 'long']),
  expectedInputLanguages: z.array(z.enum(['en', 'ja', 'es'])),
  outputLanguage: z.enum(['en', 'ja', 'es']),
});

export const DomInputConfigSchema = z.object({
  title: z.string().check(z.minLength(1, 'Title is required')),
  description: z.optional(z.string()),
  cssSelector: z.string().check(z.minLength(1, 'CSS Selector is required')),
  extract: z.enum([
    'textContent',
    'innerText',
    'innerHTML',
    'value',
    'src',
    'href',
  ]),
  defaultValue: z.string(),
  isMultiple: z.optional(z.boolean()),
});

export const StaticInputConfigSchema = z.object({
  title: z.string().check(z.minLength(1, 'Title is required')),
  description: z.optional(z.string()),
  inputValue: z.string().check(z.minLength(1, 'Input value is required')),
  isMultiple: z.optional(z.boolean()),
});

export const ConditionConfigSchema = z.object({
  title: z.string().check(z.minLength(1, 'Title is required')),
  description: z.optional(z.string()),
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
  comparisonValue: z
    .string()
    .check(z.minLength(1, 'Comparison value is required')),
});

export const MathConfigSchema = z.object({
  title: z.string().check(z.minLength(1, 'Title is required')),
  description: z.optional(z.string()),
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
  operand: z.optional(z.string()), // Second operand for binary operations
});

export const LoopConfigSchema = z.object({
  title: z.string().check(z.minLength(1, 'Title is required')),
  description: z.optional(z.string()),
});

export const DataTransformerConfigSchema = z.object({
  title: z.string().check(z.minLength(1, 'Title is required')),
  description: z.optional(z.string()),
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
  pattern: z.optional(z.string()),
  flags: z.optional(z.string()),
  path: z.optional(z.string()),
  formatType: z.optional(z.enum(['lowercase', 'uppercase', 'trim', 'length'])),
  separator: z.optional(z.string()),
  index: z.optional(z.string()),
  template: z.optional(z.string()),
  filterKey: z.optional(z.string()),
  filterValue: z.optional(z.string()),
  mapPath: z.optional(z.string()),
});

export const AlertNotificationConfigSchema = z.object({
  title: z.string().check(z.minLength(1, 'Title is required')),
  description: z.optional(z.string()),
  useCustomMessage: z.optional(z.boolean()),
  message: z.optional(z.string()),
});

export const DomReplacementConfigSchema = z
  .object({
    title: z.string().check(z.minLength(1, 'Title is required')),
    description: z.optional(z.string()),
    selector: z.optional(z.string()),
    isMultiple: z.optional(z.boolean()),
    replaceSelection: z.optional(z.boolean()),
    mode: z.optional(
      z.enum(['textContent', 'innerText', 'innerHTML', 'value'])
    ),
  })
  .check(
    z.superRefine((data, ctx) => {
      if (!data.selector && !data.replaceSelection) {
        ctx.addIssue({
          code: 'too_small',
          message: 'Selector or replaceSelection is required',
          origin: 'string',
          minimum: 1,
        });
      }
    })
  );

export const ClipboardWriterConfigSchema = z.object({
  title: z.string().check(z.minLength(1, 'Title is required')),
  description: z.optional(z.string()),
});

export const FileCreatorConfigSchema = z.object({
  title: z.string().check(z.minLength(1, 'Title is required')),
  description: z.optional(z.string()),
  filename: z.string(),
});

export const TextToSpeechConfigSchema = z.object({
  title: z.string().check(z.minLength(1, 'Title is required')),
  description: z.optional(z.string()),
});

export const TooltipConfigSchema = z.object({
  title: z.string().check(z.minLength(1, 'Title is required')),
  description: z.optional(z.string()),
  selector: z.string().check(z.minLength(1, 'Selector is required')),
});

export const SelectionToolConfigSchema = z.object({
  title: z.string().check(z.minLength(1, 'Title is required')),
  description: z.optional(z.string()),
});

export const StartEndConfigSchema = z.object({
  title: z.string().check(z.minLength(1, 'Title is required')),
  description: z.optional(z.string()),
});

/**
 * Node configuration schema (discriminated union)
 */
export const NodeConfigSchema = z.discriminatedUnion('type', [
  z.object({
    id: z.string(),
    type: z.literal(NodeType.PROMPT_API),
    ui: z.optional(NodeUIConfigSchema),
    config: PromptApiConfigSchema,
    label: z.string(),
  }),
  z.object({
    id: z.string(),
    type: z.literal(NodeType.WRITER_API),
    ui: z.optional(NodeUIConfigSchema),
    config: WriterApiConfigSchema,
    label: z.string(),
  }),
  z.object({
    id: z.string(),
    type: z.literal(NodeType.REWRITER_API),
    ui: z.optional(NodeUIConfigSchema),
    config: RewriterApiConfigSchema,
    label: z.string(),
  }),
  z.object({
    id: z.string(),
    type: z.literal(NodeType.PROOFREADER_API),
    ui: z.optional(NodeUIConfigSchema),
    config: ProofreaderApiConfigSchema,
    label: z.string(),
  }),
  z.object({
    id: z.string(),
    type: z.literal(NodeType.TRANSLATOR_API),
    ui: z.optional(NodeUIConfigSchema),
    config: TranslatorApiConfigSchema,
    label: z.string(),
  }),
  z.object({
    id: z.string(),
    type: z.literal(NodeType.LANGUAGE_DETECTOR_API),
    ui: z.optional(NodeUIConfigSchema),
    config: LanguageDetectorApiConfigSchema,
    label: z.string(),
  }),
  z.object({
    id: z.string(),
    type: z.literal(NodeType.SUMMARIZER_API),
    ui: z.optional(NodeUIConfigSchema),
    config: SummarizerApiConfigSchema,
    label: z.string(),
  }),
  z.object({
    id: z.string(),
    type: z.literal(NodeType.DOM_INPUT),
    ui: z.optional(NodeUIConfigSchema),
    config: DomInputConfigSchema,
    label: z.string(),
  }),
  z.object({
    id: z.string(),
    type: z.literal(NodeType.STATIC_INPUT),
    ui: z.optional(NodeUIConfigSchema),
    config: StaticInputConfigSchema,
    label: z.string(),
  }),
  z.object({
    id: z.string(),
    type: z.literal(NodeType.CONDITION),
    ui: z.optional(NodeUIConfigSchema),
    config: ConditionConfigSchema,
    label: z.string(),
  }),
  z.object({
    id: z.string(),
    type: z.literal(NodeType.MATH),
    ui: z.optional(NodeUIConfigSchema),
    config: MathConfigSchema,
    label: z.string(),
  }),
  z.object({
    id: z.string(),
    type: z.literal(NodeType.LOOP),
    ui: z.optional(NodeUIConfigSchema),
    config: LoopConfigSchema,
    label: z.string(),
  }),
  z.object({
    id: z.string(),
    type: z.literal(NodeType.DATA_TRANSFORMER),
    ui: z.optional(NodeUIConfigSchema),
    config: DataTransformerConfigSchema,
    label: z.string(),
  }),
  z.object({
    id: z.string(),
    type: z.literal(NodeType.ALERT_NOTIFICATION),
    ui: z.optional(NodeUIConfigSchema),
    config: AlertNotificationConfigSchema,
    label: z.string(),
  }),
  z.object({
    id: z.string(),
    type: z.literal(NodeType.DOM_REPLACEMENT),
    ui: z.optional(NodeUIConfigSchema),
    config: DomReplacementConfigSchema,
    label: z.string(),
  }),
  z.object({
    id: z.string(),
    type: z.literal(NodeType.CLIPBOARD_WRITER),
    ui: z.optional(NodeUIConfigSchema),
    config: ClipboardWriterConfigSchema,
    label: z.string(),
  }),
  z.object({
    id: z.string(),
    type: z.literal(NodeType.FILE_CREATOR),
    ui: z.optional(NodeUIConfigSchema),
    config: FileCreatorConfigSchema,
    label: z.string(),
  }),
  z.object({
    id: z.string(),
    type: z.literal(NodeType.TEXT_TO_SPEECH),
    ui: z.optional(NodeUIConfigSchema),
    config: TextToSpeechConfigSchema,
    label: z.string(),
  }),
  z.object({
    id: z.string(),
    type: z.literal(NodeType.TOOLTIP),
    ui: z.optional(NodeUIConfigSchema),
    config: TooltipConfigSchema,
    label: z.string(),
  }),
  z.object({
    id: z.string(),
    type: z.literal(NodeType.SELECTION_TOOL),
    ui: z.optional(NodeUIConfigSchema),
    config: SelectionToolConfigSchema,
    label: z.string(),
  }),
  z.object({
    id: z.string(),
    type: z.literal(NodeType.START),
    ui: z.optional(NodeUIConfigSchema),
    config: StartEndConfigSchema,
    label: z.string(),
  }),
  z.object({
    id: z.string(),
    type: z.literal(NodeType.END),
    ui: z.optional(NodeUIConfigSchema),
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
