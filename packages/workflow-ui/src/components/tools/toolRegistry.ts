/**
 * External dependencies
 */
import { NodeType, type NodeConfig } from "@google-awlt/engine-core";

export const TOOL_CONFIGS: Record<
  NodeType,
  { label: string; config: NodeConfig["config"] }
> = {
  [NodeType.PROMPT_API]: {
    label: "Prompt API",
    config: {
      title: "Prompt API",
      context: "You are a helpful assistant",
      topK: 3,
      temperature: 1,
      expectedInputsLanguages: ["en"],
      expectedOutputsLanguages: ["en"],
      initialPrompts: [],
    },
  },
  [NodeType.WRITER_API]: {
    label: "Writer API",
    config: {
      title: "Writer",
      context:
        "A helpful assistant that writes content based on the provided context.",
      tone: "neutral",
      format: "markdown",
      length: "short",
      expectedInputLanguages: ["en", "ja", "es"],
      outputLanguage: "en",
    },
  },
  [NodeType.REWRITER_API]: {
    label: "Rewriter API",
    config: {
      title: "Rewriter",
      context:
        "A helpful assistant that rewrites content to change its tone and length.",
      tone: "more-formal",
      format: "as-is",
      length: "as-is",
      expectedInputLanguages: ["en", "ja", "es"],
      outputLanguage: "en",
    },
  },
  [NodeType.PROOFREADER_API]: {
    label: "Proofreader API",
    config: {
      title: "Proofreader",
      context:
        "A helpful assistant that proofreads content for grammar and spelling errors.",
      expectedInputLanguage: "en",
      outputLanguage: "en",
    },
  },
  [NodeType.TRANSLATOR_API]: {
    label: "Translator API",
    config: {
      title: "Translator",
      context:
        "A helpful assistant that translates content into a different language.",
      sourceLanguage: "en",
      targetLanguage: "es",
    },
  },
  [NodeType.LANGUAGE_DETECTOR_API]: {
    label: "Language Detector",
    config: {
      title: "Language Detector",
      description: "Detects the language of the provided text.",
    },
  },
  [NodeType.SUMMARIZER_API]: {
    label: "Summarizer API",
    config: {
      title: "Summarizer",
      context:
        "A helpful assistant that summarizes content for better understanding.",
      type: "key-points",
      format: "markdown",
      length: "short",
      expectedInputLanguages: ["en", "ja", "es"],
      outputLanguage: "en",
    },
  },
  [NodeType.DOM_INPUT]: {
    label: "DOM Input",
    config: {
      title: "DOM Input",
      description: "Extract text from a website using a CSS selector.",
    },
  },
  [NodeType.STATIC_INPUT]: {
    label: "Static Input",
    config: {
      title: "Static Input",
      description: "Provide a static text input.",
      inputValue: "",
      isMultiple: false,
    },
  },
  [NodeType.CONDITION]: {
    label: "Condition",
    config: {
      title: "Condition",
      description: "Route flow based on a condition.",
      comparisonType: "equals",
      comparisonValue: "",
    },
  },
  [NodeType.MATH]: {
    label: "Math",
    config: {
      title: "Math",
      description: "Perform basic math operations.",
      operation: "add",
      operand: "0",
    },
  },
  [NodeType.LOOP]: {
    label: "Loop",
    config: {
      title: "Loop",
      description: "Iterate over an array of items.",
    },
  },
  [NodeType.DATA_TRANSFORMER]: {
    label: "Data Transformer",
    config: {
      title: "Data Transformer",
      description: "Transform strings using Regex, JSON, or templates.",
      operation: "format",
      formatType: "trim",
    },
  },
  [NodeType.ALERT_NOTIFICATION]: {
    label: "Alert Notification",
    config: {
      title: "Alert Notification",
      description: "Display an alert notification to the user.",
      useCustomMessage: false,
      message: "",
    },
  },
  [NodeType.DOM_REPLACEMENT]: {
    label: "DOM Replacement",
    config: {
      title: "DOM Replacement",
      description: "Replace content of an element on the page.",
      selector: "",
    },
  },
  [NodeType.CLIPBOARD_WRITER]: {
    label: "Clipboard Writer",
    config: {
      title: "Clipboard Writer",
      description: "Copy input to the clipboard.",
    },
  },
  [NodeType.FILE_CREATOR]: {
    label: "File Creator",
    config: {
      title: "File Creator",
      description: "Download input as a file.",
      filename: "output.txt",
    },
  },
  [NodeType.TEXT_TO_SPEECH]: {
    label: "Text to Speech",
    config: {
      title: "Text to Speech",
      description: "Read input text aloud.",
    },
  },
  [NodeType.TOOLTIP]: {
    label: "Tooltip",
    config: {
      title: "Tooltip",
      description: "Show a tooltip on the page.",
      selector: "",
    },
  },
  [NodeType.SELECTION_TOOL]: {
    label: "Selection Tool",
    config: {
      title: "Selection Tool",
      description: "Interactive text selection from the web page.",
    },
  },
  [NodeType.START]: {
    label: "Start",
    config: {
      title: "Start",
      description: "Workflow entry point.",
    },
  },
  [NodeType.END]: {
    label: "End",
    config: {
      title: "End",
      description: "Workflow exit point.",
    },
  },
};
