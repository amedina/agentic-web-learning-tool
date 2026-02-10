/**
 * External dependencies
 */
import { type WorkflowJSON, NodeType } from '@google-awlt/engine-core';

export const PREDEFINED_WORKFLOWS: WorkflowJSON[] = [
  {
    meta: {
      id: 'demo-translation',
      name: 'Built-in: Smart Translator',
      sanitizedName: 'Built_in__Smart_Translator',
      description: 'Automatically translates selected text into Spanish.',
      savedAt: new Date().toISOString(),
      allowedDomains: ['<all_urls>'],
      isWebMCP: true,
      autosave: false,
    },
    graph: {
      nodes: [
        {
          id: 'start',
          type: NodeType.START,
          config: {
            title: 'Start',
          },
          label: 'start',
          ui: {
            position: {
              x: 27,
              y: 52,
            },
          },
        },
        {
          id: 'dom-input',
          type: NodeType.DOM_INPUT,
          config: {
            title: 'Get Selected Text',
            cssSelector: 'body',
            extract: 'textContent',
            defaultValue: 'Selection not found',
          },
          label: 'domInput',
          ui: {
            position: {
              x: 35,
              y: 130,
            },
          },
        },
        {
          id: 'translator',
          type: NodeType.TRANSLATOR_API,
          config: {
            title: 'Translate',
            sourceLanguage: 'en',
            targetLanguage: 'es',
          },
          label: 'translatorApi',
          ui: {
            position: {
              x: 173,
              y: 332,
            },
          },
        },
        {
          id: 'alert',
          type: NodeType.ALERT_NOTIFICATION,
          config: {
            title: 'Translation Result',
            useCustomMessage: false,
          },
          label: 'alertNotification',
          ui: {
            position: {
              x: 537,
              y: 174,
            },
          },
        },
        {
          id: 'end',
          type: NodeType.END,
          config: {
            title: 'End',
          },
          label: 'end',
          ui: {
            position: {
              x: 722,
              y: 467,
            },
          },
        },
      ],
      edges: [
        {
          id: 'e1-2',
          source: 'start',
          target: 'dom-input',
          sourceHandle: null,
          targetHandle: null,
        },
        {
          id: 'e2-3',
          source: 'dom-input',
          target: 'translator',
          sourceHandle: null,
          targetHandle: null,
        },
        {
          id: 'e3-4',
          source: 'translator',
          target: 'alert',
          sourceHandle: null,
          targetHandle: null,
        },
        {
          id: 'e4-5',
          source: 'alert',
          target: 'end',
          sourceHandle: null,
          targetHandle: null,
        },
      ],
    },
  },
  {
    meta: {
      id: 'demo-summarizer',
      name: 'Built-in: Quick Summarizer',
      sanitizedName: 'Built_in__Quick_Summarizer',
      description: 'Summarizes the current page into key points.',
      savedAt: new Date().toISOString(),
      allowedDomains: ['<all_urls>'],
      isWebMCP: true,
      autosave: false,
    },
    graph: {
      nodes: [
        {
          id: 'start',
          type: NodeType.START,
          config: {
            title: 'Start',
          },
          label: 'start',
          ui: {
            position: {
              x: 21,
              y: 47,
            },
          },
        },
        {
          id: 'dom-input',
          type: NodeType.DOM_INPUT,
          config: {
            title: 'Get Content',
            cssSelector: 'body',
            extract: 'innerText',
            defaultValue: '',
          },
          label: 'domInput',
          ui: {
            position: {
              x: 52,
              y: 153,
            },
          },
        },
        {
          id: 'summarizer',
          type: NodeType.SUMMARIZER_API,
          config: {
            title: 'Summarize',
            type: 'key-points',
            format: 'markdown',
            length: 'medium',
            outputLanguage: 'en',
            context: 'Summarize the following content into key points.',
            expectedInputLanguages: ['en'],
          },
          label: 'summarizerApi',
          ui: {
            position: {
              x: 286,
              y: 394,
            },
          },
        },
        {
          id: 'alert',
          type: NodeType.ALERT_NOTIFICATION,
          config: {
            title: 'Summary',
            useCustomMessage: false,
          },
          label: 'alertNotification',
          ui: {
            position: {
              x: 566,
              y: 128,
            },
          },
        },
        {
          id: 'end',
          type: NodeType.END,
          config: {
            title: 'End',
          },
          label: 'end',
          ui: {
            position: {
              x: 752,
              y: 441,
            },
          },
        },
      ],
      edges: [
        {
          id: 'e1-2',
          source: 'start',
          target: 'dom-input',
          sourceHandle: null,
          targetHandle: null,
        },
        {
          id: 'e2-3',
          source: 'dom-input',
          target: 'summarizer',
          sourceHandle: null,
          targetHandle: null,
        },
        {
          id: 'e3-4',
          source: 'summarizer',
          target: 'alert',
          sourceHandle: null,
          targetHandle: null,
        },
        {
          id: 'e4-5',
          source: 'alert',
          target: 'end',
          sourceHandle: null,
          targetHandle: null,
        },
      ],
    },
  },
  {
    meta: {
      id: 'demo-snowfall',
      name: 'Built-in: Let It Snow!',
      sanitizedName: 'Built_in__Let_It_Snow',
      description:
        'Injects a snowfall effect into the current page. WARNING: Resets DOM state (forms, video, etc).',
      savedAt: new Date().toISOString(),
      allowedDomains: ['<all_urls>'],
      isWebMCP: true,
      autosave: false,
    },
    graph: {
      nodes: [
        {
          id: 'start-node',
          type: NodeType.START,
          config: {
            title: 'Start',
            description: 'Workflow entry point',
          },
          label: 'start',
          ui: {
            position: {
              x: 23,
              y: 33,
            },
          },
        },
        {
          id: 'get-body-content',
          type: NodeType.DOM_INPUT,
          config: {
            title: 'Read Body HTML',
            description: 'Reads the current page content to preserve it.',
            cssSelector: 'body',
            extract: 'innerHTML',
            isMultiple: false,
            defaultValue: '',
          },
          label: 'domInput',
          ui: {
            position: {
              x: 47,
              y: 149,
            },
          },
        },
        {
          id: 'add-snow-overlay',
          type: NodeType.DATA_TRANSFORMER,
          config: {
            title: 'Inject Snow HTML/CSS',
            operation: 'template',
            template:
              '{{input}} <style> #awlt-snow-container { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 999999; overflow: hidden; } .snowflake { position: absolute; top: -10px; color: #FFF; font-size: 2em; font-family: Arial, sans-serif; text-shadow: 0 0 5px #000; user-select: none; z-index: 1000; animation-name: snow-fall, snow-shake; animation-duration: 10s, 3s; animation-timing-function: linear, ease-in-out; animation-iteration-count: infinite, infinite; animation-play-state: running, running; } @keyframes snow-fall { 0% { top: -10%; } 100% { top: 100%; } } @keyframes snow-shake { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(80px); } } .snowflake:nth-of-type(0) { left: 1%; animation-delay: 0s, 0s; } .snowflake:nth-of-type(1) { left: 10%; animation-delay: 1s, 1s; } .snowflake:nth-of-type(2) { left: 20%; animation-delay: 6s, .5s; } .snowflake:nth-of-type(3) { left: 30%; animation-delay: 4s, 2s; } .snowflake:nth-of-type(4) { left: 40%; animation-delay: 2s, 2s; } .snowflake:nth-of-type(5) { left: 50%; animation-delay: 8s, 3s; } .snowflake:nth-of-type(6) { left: 60%; animation-delay: 6s, 2s; } .snowflake:nth-of-type(7) { left: 70%; animation-delay: 2.5s, 1s; } .snowflake:nth-of-type(8) { left: 80%; animation-delay: 1s, 0s; } .snowflake:nth-of-type(9) { left: 90%; animation-delay: 3s, 1.5s; } .snowflake:nth-of-type(10) { left: 25%; animation-delay: 2s, 0s; } </style> <div id="awlt-snow-container" aria-hidden="true"> <div class="snowflake">❄</div> <div class="snowflake">❅</div> <div class="snowflake">❆</div> <div class="snowflake">❄</div> <div class="snowflake">❅</div> <div class="snowflake">❆</div> <div class="snowflake">❄</div> <div class="snowflake">❅</div> <div class="snowflake">❆</div> <div class="snowflake">❄</div> <div class="snowflake">❅</div> </div>',
          },
          label: 'dataTransformer',
          ui: {
            position: {
              x: 163,
              y: 385,
            },
          },
        },
        {
          id: 'apply-changes',
          type: NodeType.DOM_REPLACEMENT,
          config: {
            title: 'Update Page Body',
            description: 'Replaces the body content with the snow version.',
            selector: 'body',
            mode: 'innerHTML',
            isMultiple: false,
          },
          label: 'domReplacement',
          ui: {
            position: {
              x: 508,
              y: 181,
            },
          },
        },
        {
          id: 'end-node',
          type: NodeType.END,
          config: {
            title: 'End',
            description: 'Workflow exit point',
          },
          label: 'end',
          ui: {
            position: {
              x: 824,
              y: 428,
            },
          },
        },
      ],
      edges: [
        {
          id: 'edge-1',
          source: 'start-node',
          target: 'get-body-content',
          sourceHandle: null,
          targetHandle: null,
        },
        {
          id: 'edge-2',
          source: 'get-body-content',
          target: 'add-snow-overlay',
          sourceHandle: null,
          targetHandle: null,
        },
        {
          id: 'edge-3',
          source: 'add-snow-overlay',
          target: 'apply-changes',
          sourceHandle: null,
          targetHandle: null,
        },
        {
          id: 'edge-4',
          source: 'apply-changes',
          target: 'end-node',
          sourceHandle: null,
          targetHandle: null,
        },
      ],
    },
  },
];
