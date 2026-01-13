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
} from "./tools";

interface BuiltInAIToolsProps {
  collapsed?: boolean;
}

const BuiltInAITools = ({ collapsed }: BuiltInAIToolsProps) => {
  return (
    <div className="w-full">
      {!collapsed ? (
        <h3 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-3 px-1">
          Gemini Nano APIs
        </h3>
      ) : (
        <div className="border-t border-slate-200 dark:border-border my-4 mx-2" />
      )}
      <div className="space-y-1">
        <PromptApi />
        <WriterApi />
        <RewriterApi />
        <ProofreaderApi />
        <TranslatorApi />
        <LanguageDetectorApi />
        <SummarizerApi />
      </div>
    </div>
  );
};

export default BuiltInAITools;
