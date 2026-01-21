/**
 * Internal dependencies
 */
import { NodeRegistry } from "../engine/NodeRegistry";

// JS Tool Executors
export { staticInputExecutor } from "./staticInputExecutor";
export { domInputExecutor } from "./domInputExecutor";
export { alertNotificationExecutor } from "./alertNotificationExecutor";
export { conditionExecutor } from "./conditionExecutor";
export { loopExecutor } from "./loopExecutor";
export { domReplacementExecutor } from "./domReplacementExecutor";
export { clipboardWriterExecutor } from "./clipboardWriterExecutor";
export { fileCreatorExecutor } from "./fileCreatorExecutor";
export { textToSpeechExecutor } from "./textToSpeechExecutor";
export { tooltipExecutor } from "./tooltipExecutor";

// Built-in AI API Executors
export { promptApiExecutor } from "./promptApiExecutor";
export { writerApiExecutor } from "./writerApiExecutor";
export { rewriterApiExecutor } from "./rewriterApiExecutor";
export { proofreaderApiExecutor } from "./proofreaderApiExecutor";
export { translatorApiExecutor } from "./translatorApiExecutor";
export { languageDetectorApiExecutor } from "./languageDetectorApiExecutor";
export { summarizerApiExecutor } from "./summarizerApiExecutor";

// Import all executors for registration
import { staticInputExecutor } from "./staticInputExecutor";
import { domInputExecutor } from "./domInputExecutor";
import { alertNotificationExecutor } from "./alertNotificationExecutor";
import { conditionExecutor } from "./conditionExecutor";
import { promptApiExecutor } from "./promptApiExecutor";
import { writerApiExecutor } from "./writerApiExecutor";
import { rewriterApiExecutor } from "./rewriterApiExecutor";
import { proofreaderApiExecutor } from "./proofreaderApiExecutor";
import { translatorApiExecutor } from "./translatorApiExecutor";
import { languageDetectorApiExecutor } from "./languageDetectorApiExecutor";
import { summarizerApiExecutor } from "./summarizerApiExecutor";
import { loopExecutor } from "./loopExecutor";
import { domReplacementExecutor } from "./domReplacementExecutor";
import { clipboardWriterExecutor } from "./clipboardWriterExecutor";
import { fileCreatorExecutor } from "./fileCreatorExecutor";
import { textToSpeechExecutor } from "./textToSpeechExecutor";
import { tooltipExecutor } from "./tooltipExecutor";

/**
 * Register all built-in node executors with the NodeRegistry.
 * This should be called once during engine initialization.
 */
export function registerBuiltinExecutors(): void {
  // JS Tool Nodes
  NodeRegistry.register("staticInput", staticInputExecutor);
  NodeRegistry.register("domInput", domInputExecutor);
  NodeRegistry.register("alertNotification", alertNotificationExecutor);
  NodeRegistry.register("condition", conditionExecutor);
  NodeRegistry.register("loop", loopExecutor);
  NodeRegistry.register("domReplacement", domReplacementExecutor);
  NodeRegistry.register("clipboardWriter", clipboardWriterExecutor);
  NodeRegistry.register("fileCreator", fileCreatorExecutor);
  NodeRegistry.register("textToSpeech", textToSpeechExecutor);
  NodeRegistry.register("tooltip", tooltipExecutor);

  // Built-in AI API Nodes
  NodeRegistry.register("promptApi", promptApiExecutor);
  NodeRegistry.register("writerApi", writerApiExecutor);
  NodeRegistry.register("rewriterApi", rewriterApiExecutor);
  NodeRegistry.register("proofreaderApi", proofreaderApiExecutor);
  NodeRegistry.register("translatorApi", translatorApiExecutor);
  NodeRegistry.register("languageDetectorApi", languageDetectorApiExecutor);
  NodeRegistry.register("summarizerApi", summarizerApiExecutor);
}
