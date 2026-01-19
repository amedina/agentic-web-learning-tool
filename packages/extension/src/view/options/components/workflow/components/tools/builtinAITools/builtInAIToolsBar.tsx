/**
 * Internal dependencies
 */
import {
  LanguageDetectorApi,
  PromptApi,
  ProofreaderApi,
  RewriterApi,
  SummarizerApi,
  TranslatorApi,
  WriterApi,
} from '.';

const BuiltInAITools = () => {
  return (
    <div className="w-full">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
        Gemini Nano APIs
      </h3>
      <PromptApi />
      <WriterApi />
      <RewriterApi />
      <ProofreaderApi />
      <TranslatorApi />
      <LanguageDetectorApi />
      <SummarizerApi />
    </div>
  );
};

export default BuiltInAITools;
