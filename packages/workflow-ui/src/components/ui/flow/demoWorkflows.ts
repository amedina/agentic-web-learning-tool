/**
 * External dependencies
 */
import { type WorkflowJSON, NodeType } from "@google-awlt/engine-core";

export const PREDEFINED_WORKFLOWS: WorkflowJSON[] = [
  {
    meta: {
      id: "demo-translation",
      name: "Built-in: Smart Translator",
      description: "Automatically translates selected text into Spanish.",
      savedAt: new Date().toISOString(),
      allowedDomains: ["*"],
      isWebMCP: true,
      autosave: false,
    },
    graph: {
      nodes: [
        {
          id: "start",
          type: NodeType.START,
          label: "Start",
          config: { title: "Start" },
          ui: { position: { x: 50, y: 250 } },
        },
        {
          id: "dom-input",
          type: NodeType.DOM_INPUT,
          label: "Get Selected Text",
          config: {
            title: "Get Selected Text",
            cssSelector: "body",
            extract: "textContent",
            defaultValue: "Selection not found",
          },
          ui: { position: { x: 250, y: 250 } },
        },
        {
          id: "translator",
          type: NodeType.TRANSLATOR_API,
          label: "Translate to Spanish",
          config: {
            title: "Translate",
            sourceLanguage: "en",
            targetLanguage: "es",
          },
          ui: { position: { x: 450, y: 250 } },
        },
        {
          id: "alert",
          type: NodeType.ALERT_NOTIFICATION,
          label: "Show Translation",
          config: {
            title: "Translation Result",
            useCustomMessage: false,
          },
          ui: { position: { x: 650, y: 250 } },
        },
        {
          id: "end",
          type: NodeType.END,
          label: "End",
          config: { title: "End" },
          ui: { position: { x: 850, y: 250 } },
        },
      ],
      edges: [
        { id: "e1-2", source: "start", target: "dom-input" },
        { id: "e2-3", source: "dom-input", target: "translator" },
        { id: "e3-4", source: "translator", target: "alert" },
        { id: "e4-5", source: "alert", target: "end" },
      ],
    },
  },
  {
    meta: {
      id: "demo-summarizer",
      name: "Built-in: Quick Summarizer",
      description: "Summarizes the current page into key points.",
      savedAt: new Date().toISOString(),
      allowedDomains: ["*"],
      isWebMCP: true,
      autosave: false,
    },
    graph: {
      nodes: [
        {
          id: "start",
          type: NodeType.START,
          label: "Start",
          config: { title: "Start" },
          ui: { position: { x: 50, y: 250 } },
        },
        {
          id: "dom-input",
          type: NodeType.DOM_INPUT,
          label: "Get Page Content",
          config: {
            title: "Get Content",
            cssSelector: "body",
            extract: "innerText",
            defaultValue: "",
          },
          ui: { position: { x: 250, y: 250 } },
        },
        {
          id: "summarizer",
          type: NodeType.SUMMARIZER_API,
          label: "Summarize",
          config: {
            title: "Summarize",
            type: "key-points",
            format: "markdown",
            length: "medium",
            outputLanguage: "en",
            context: "Summarize the following content into key points.",
            expectedInputLanguages: ["en"],
          },
          ui: { position: { x: 450, y: 250 } },
        },
        {
          id: "alert",
          type: NodeType.ALERT_NOTIFICATION,
          label: "Show Summary",
          config: {
            title: "Summary",
            useCustomMessage: false,
          },
          ui: { position: { x: 650, y: 250 } },
        },
        {
          id: "end",
          type: NodeType.END,
          label: "End",
          config: { title: "End" },
          ui: { position: { x: 850, y: 250 } },
        },
      ],
      edges: [
        { id: "e1-2", source: "start", target: "dom-input" },
        { id: "e2-3", source: "dom-input", target: "summarizer" },
        { id: "e3-4", source: "summarizer", target: "alert" },
        { id: "e4-5", source: "alert", target: "end" },
      ],
    },
  },
];
