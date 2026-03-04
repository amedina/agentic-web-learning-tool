/**
 * Internal dependencies
 */
import { NodeRegistry } from '../engine/NodeRegistry';

// JS Tool Executors
export { staticInputExecutor } from './staticInputExecutor';
export { domInputExecutor } from './domInputExecutor';
export { alertNotificationExecutor } from './alertNotificationExecutor';
export { conditionExecutor } from './conditionExecutor';
export { loopExecutor } from './loopExecutor';
export { domReplacementExecutor } from './domReplacementExecutor';
export { clipboardWriterExecutor } from './clipboardWriterExecutor';
export { fileCreatorExecutor } from './fileCreatorExecutor';
export { textToSpeechExecutor } from './textToSpeechExecutor';
export { tooltipExecutor } from './tooltipExecutor';
export { mathExecutor } from './mathExecutor';
export { selectionToolExecutor } from './selectionToolExecutor';

// Built-in AI API Executors
export { promptApiExecutor } from './promptApiExecutor';
export { writerApiExecutor } from './writerApiExecutor';
export { rewriterApiExecutor } from './rewriterApiExecutor';
export { proofreaderApiExecutor } from './proofreaderApiExecutor';
export { translatorApiExecutor } from './translatorApiExecutor';
export { languageDetectorApiExecutor } from './languageDetectorApiExecutor';
export { summarizerApiExecutor } from './summarizerApiExecutor';

// Import all executors for registration
import { staticInputExecutor } from './staticInputExecutor';
import { domInputExecutor } from './domInputExecutor';
import { alertNotificationExecutor } from './alertNotificationExecutor';
import { conditionExecutor } from './conditionExecutor';
import { promptApiExecutor } from './promptApiExecutor';
import { writerApiExecutor } from './writerApiExecutor';
import { rewriterApiExecutor } from './rewriterApiExecutor';
import { proofreaderApiExecutor } from './proofreaderApiExecutor';
import { translatorApiExecutor } from './translatorApiExecutor';
import { languageDetectorApiExecutor } from './languageDetectorApiExecutor';
import { summarizerApiExecutor } from './summarizerApiExecutor';
import { loopExecutor } from './loopExecutor';
import { domReplacementExecutor } from './domReplacementExecutor';
import { clipboardWriterExecutor } from './clipboardWriterExecutor';
import { fileCreatorExecutor } from './fileCreatorExecutor';
import { textToSpeechExecutor } from './textToSpeechExecutor';
import { tooltipExecutor } from './tooltipExecutor';
import { dataTransformerExecutor } from './dataTransformerExecutor';
import { mathExecutor } from './mathExecutor';
import { selectionToolExecutor } from './selectionToolExecutor';
import { startExecutor } from './start';
import { endExecutor } from './end';

import { NodeType } from '../types';

/**
 * Register all built-in node executors with the NodeRegistry.
 * This should be called once during engine initialization.
 */
export function registerBuiltinExecutors(): void {
  // JS Tool Nodes
  NodeRegistry.register(NodeType.STATIC_INPUT, staticInputExecutor);
  NodeRegistry.register(NodeType.DOM_INPUT, domInputExecutor);
  NodeRegistry.register(NodeType.ALERT_NOTIFICATION, alertNotificationExecutor);
  NodeRegistry.register(NodeType.CONDITION, conditionExecutor);
  NodeRegistry.register(NodeType.LOOP, loopExecutor);
  NodeRegistry.register(NodeType.DATA_TRANSFORMER, dataTransformerExecutor);
  NodeRegistry.register(NodeType.MATH, mathExecutor);
  NodeRegistry.register(NodeType.DOM_REPLACEMENT, domReplacementExecutor);
  NodeRegistry.register(NodeType.CLIPBOARD_WRITER, clipboardWriterExecutor);
  NodeRegistry.register(NodeType.FILE_CREATOR, fileCreatorExecutor);
  NodeRegistry.register(NodeType.TEXT_TO_SPEECH, textToSpeechExecutor);
  NodeRegistry.register(NodeType.TOOLTIP, tooltipExecutor);
  NodeRegistry.register(NodeType.SELECTION_TOOL, selectionToolExecutor);

  // Built-in AI API Nodes
  NodeRegistry.register(NodeType.PROMPT_API, promptApiExecutor);
  NodeRegistry.register(NodeType.WRITER_API, writerApiExecutor);
  NodeRegistry.register(NodeType.REWRITER_API, rewriterApiExecutor);
  NodeRegistry.register(NodeType.PROOFREADER_API, proofreaderApiExecutor);
  NodeRegistry.register(NodeType.TRANSLATOR_API, translatorApiExecutor);
  NodeRegistry.register(
    NodeType.LANGUAGE_DETECTOR_API,
    languageDetectorApiExecutor
  );
  NodeRegistry.register(NodeType.SUMMARIZER_API, summarizerApiExecutor);

  NodeRegistry.register(NodeType.START, startExecutor);
  NodeRegistry.register(NodeType.END, endExecutor);
}
