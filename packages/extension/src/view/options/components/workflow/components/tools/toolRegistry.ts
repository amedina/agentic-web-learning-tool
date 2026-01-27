import type { NodeConfig } from '../../stateProviders';

export const TOOL_CONFIGS: Record<
  string,
  { label: string; config: NodeConfig['config'] }
> = {
  promptApi: {
    label: 'Chat Assistant',
    config: {
      title: 'Chat Assistant',
      context: 'You are a helpful assistant',
      topK: 3,
      temperature: 1,
      expectedInputsLanguages: ['en'],
      expectedOutputsLanguages: ['en'],
      initialPrompts: [],
    },
  },
  writerApi: {
    label: 'Writer API',
    config: {
      title: 'Writer',
      context:
        'A helpful assistant that writes content based on the provided context.',
      tone: 'neutral',
      format: 'markdown',
      length: 'short',
      expectedInputLanguages: ['en', 'ja', 'es'],
      outputLanguage: 'en',
    },
  },
  rewriterApi: {
    label: 'Rewriter API',
    config: {
      title: 'Rewriter',
      context:
        'A helpful assistant that rewrites content to change its tone and length.',
      tone: 'more-formal',
      format: 'as-is',
      length: 'as-is',
      expectedInputLanguages: ['en', 'ja', 'es'],
      outputLanguage: 'en',
    },
  },
  proofreaderApi: {
    label: 'Proofreader API',
    config: {
      title: 'Proofreader',
      context:
        'A helpful assistant that proofreads content for grammar and spelling errors.',
      expectedInputLanguages: ['en', 'es', 'ja'],
      outputLanguage: 'en',
    },
  },
  translatorApi: {
    label: 'Translator API',
    config: {
      title: 'Translator',
      context:
        'A helpful assistant that translates content into a different language.',
      sourceLanguage: 'en',
      targetLanguage: 'es',
    },
  },
  languageDetectorApi: {
    label: 'Language Detector',
    config: {
      title: 'Language Detector',
      description: 'Detects the language of the provided text.',
    },
  },
  summarizerApi: {
    label: 'Summarizer API',
    config: {
      title: 'Summarizer',
      context:
        'A helpful assistant that summarizes content for better understanding.',
      type: 'key-points',
      format: 'markdown',
      length: 'short',
      expectedInputLanguages: ['en', 'ja', 'es'],
      outputLanguage: 'en',
    },
  },
  domInput: {
    label: 'DOM Input',
    config: {
      title: 'DOM Input',
      description: 'Extract text from a website using a CSS selector.',
    },
  },
  staticInput: {
    label: 'Static Input',
    config: {
      title: 'Static Input',
      description: 'Provide a static text input.',
      inputValue: '',
    },
  },
  condition: {
    label: 'Condition',
    config: {
      title: 'Condition',
      description: 'Route flow based on a condition.',
      comparisonType: 'equals',
      comparisonValue: '',
    },
  },
  math: {
    label: 'Math',
    config: {
      title: 'Math',
      description: 'Perform basic math operations.',
      operation: 'add',
      operand: '0',
    },
  },
  loop: {
    label: 'Loop',
    config: {
      title: 'Loop',
      description: 'Iterate over an array of items.',
    },
  },
  dataTransformer: {
    label: 'Data Transformer',
    config: {
      title: 'Data Transformer',
      description: 'Transform strings using Regex, JSON, or templates.',
      operation: 'format',
      formatType: 'trim',
    },
  },
  alertNotification: {
    label: 'Alert Notification',
    config: {
      title: 'Alert Notification',
      description: 'Display an alert notification to the user.',
      useCustomMessage: false,
      message: '',
    },
  },
  domReplacement: {
    label: 'DOM Replacement',
    config: {
      title: 'DOM Replacement',
      description: 'Replace content of an element on the page.',
      selector: '',
    },
  },
  clipboardWriter: {
    label: 'Clipboard Writer',
    config: {
      title: 'Clipboard Writer',
      description: 'Copy input to the clipboard.',
    },
  },
  fileCreator: {
    label: 'File Creator',
    config: {
      title: 'File Creator',
      description: 'Download input as a file.',
      filename: 'output.txt',
    },
  },
  textToSpeech: {
    label: 'Text to Speech',
    config: {
      title: 'Text to Speech',
      description: 'Read input text aloud.',
    },
  },
  tooltip: {
    label: 'Tooltip',
    config: {
      title: 'Tooltip',
      description: 'Show a tooltip on the page.',
      selector: '',
    },
  },
  start: {
    label: 'Start',
    config: {
      title: 'Start',
      description: 'Workflow entry point.',
    },
  },
  end: {
    label: 'End',
    config: {
      title: 'End',
      description: 'Workflow exit point.',
    },
  },
};
