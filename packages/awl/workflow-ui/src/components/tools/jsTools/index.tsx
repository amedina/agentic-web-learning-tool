/**
 * Internal dependencies
 */
import { DomInput, StaticInput, SelectionTool } from "./inputTools";
import { Condition, Loop, DataTransformer, MathTool } from "./logicTools";
import {
  AlertNotification,
  ClipboardWriter,
  DomReplacement,
  FileCreator,
  TextToSpeech,
  Tooltip,
} from "./outputTools";

interface JSToolsProps {
  collapsed?: boolean;
}

const JSTools = ({ collapsed }: JSToolsProps) => {
  return (
    <>
      <div className="w-full">
        {!collapsed ? (
          <h3 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-3 px-1">
            Input
          </h3>
        ) : (
          <div className="border-t border-slate-200 dark:border-border my-4 mx-2" />
        )}
        <div className="space-y-1">
          <DomInput />
          <StaticInput />
          <SelectionTool />
        </div>
      </div>

      <div className="w-full">
        {!collapsed ? (
          <h3 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-3 px-1">
            Logic
          </h3>
        ) : (
          <div className="border-t border-slate-200 dark:border-border my-4 mx-2" />
        )}
        <div className="space-y-1">
          <Condition />
          <Loop />
          <DataTransformer />
          <MathTool />
        </div>
      </div>

      <div className="w-full">
        {!collapsed ? (
          <h3 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider mb-3 px-1">
            Output
          </h3>
        ) : (
          <div className="border-t border-slate-200 dark:border-border my-4 mx-2" />
        )}
        <div className="space-y-1">
          <AlertNotification />
          <DomReplacement />
          <Tooltip />
          <TextToSpeech />
          <ClipboardWriter />
          <FileCreator />
        </div>
      </div>
    </>
  );
};

export default JSTools;
