import type { NodeConfig } from '@/options/store';

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
			initialPrompts: [
				{ role: 'system', content: 'You are a helpful assistant.' },
			],
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
	alertNotification: {
		label: 'Alert Notification',
		config: {
			title: 'Alert Notification',
			description: 'Display an alert notification to the user.',
		},
	},
};
