import { memo, useState, useCallback } from "react";
import type { Prompt } from "@modelcontextprotocol/sdk/types.js";
import { Button, cn } from "@google-awlt/design-system";
import { MessageSquare, Play } from "lucide-react";

interface PromptViewProps {
  prompts: Prompt[];
  onExecute?: (name: string, args: Record<string, string>) => void;
  className?: string;
}

export const PromptView = memo(function PromptView({
  prompts,
  onExecute,
  className,
}: PromptViewProps) {
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [args, setArgs] = useState<Record<string, string>>({});

  const handleArgChange = useCallback((key: string, value: string) => {
    setArgs((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleExecute = useCallback(() => {
    if (!selectedPrompt || !onExecute) return;
    onExecute(selectedPrompt, args);
  }, [selectedPrompt, args, onExecute]);

  const selectedPromptDef = prompts.find((p) => p.name === selectedPrompt);

  return (
    <div className={cn("flex h-full", className)}>
      {/* Prompt List */}
      <div className="w-1/3 border-r overflow-auto">
        <div className="p-4 font-semibold border-b">Prompts</div>
        {prompts.map((prompt) => (
          <button
            key={prompt.name}
            onClick={() => {
              setSelectedPrompt(prompt.name);
              setArgs({});
            }}
            className={cn(
              "w-full text-left p-3 border-b hover:bg-muted/50 transition-colors flex items-start gap-2",
              selectedPrompt === prompt.name && "bg-muted",
            )}
          >
            <MessageSquare className="h-4 w-4 mt-1 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <div className="font-medium truncate">{prompt.name}</div>
              <div className="text-xs text-muted-foreground line-clamp-2">
                {prompt.description}
              </div>
            </div>
          </button>
        ))}
        {prompts.length === 0 && (
          <div className="p-4 text-center text-muted-foreground text-sm">
            No prompts available
          </div>
        )}
      </div>

      {/* Prompt Execution */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedPromptDef ? (
          <div className="flex flex-col h-full">
            <div className="p-4 border-b bg-muted/10">
              <h3 className="font-bold flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                {selectedPrompt}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedPromptDef.description}
              </p>
            </div>
            <div className="flex-1 p-4 overflow-auto space-y-4">
              {selectedPromptDef.arguments?.map((arg) => (
                <div key={arg.name}>
                  <label className="block text-sm font-medium mb-1">
                    {arg.name}{" "}
                    {arg.required && (
                      <span className="text-destructive">*</span>
                    )}
                  </label>
                  <p className="text-xs text-muted-foreground mb-2">
                    {arg.description}
                  </p>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-md bg-background"
                    value={args[arg.name] || ""}
                    onChange={(e) => handleArgChange(arg.name, e.target.value)}
                    required={arg.required}
                  />
                </div>
              ))}
              {(!selectedPromptDef.arguments ||
                selectedPromptDef.arguments.length === 0) && (
                <div className="text-muted-foreground italic">
                  No arguments needed.
                </div>
              )}
            </div>
            <div className="p-4 border-t flex justify-end">
              <Button onClick={handleExecute} disabled={!onExecute}>
                <Play className="h-4 w-4 mr-2" />
                Execute Prompt
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a prompt to view details
          </div>
        )}
      </div>
    </div>
  );
});
