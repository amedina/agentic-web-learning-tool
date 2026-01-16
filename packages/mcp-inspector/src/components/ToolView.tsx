import { memo, useState, useCallback } from "react";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { Button, cn } from "@google-awlt/design-system";
import { Wrench, Play } from "lucide-react";

interface ToolViewProps {
  tools: Tool[];
  onExecute?: (name: string, args: Record<string, any>) => void;
  className?: string;
}

export const ToolView = memo(function ToolView({
  tools,
  onExecute,
  className,
}: ToolViewProps) {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [argsJson, setArgsJson] = useState<string>("{}");

  const handleExecute = useCallback(() => {
    if (!selectedTool || !onExecute) return;
    try {
      const args = JSON.parse(argsJson);
      onExecute(selectedTool, args);
    } catch (e) {
      console.error("Invalid JSON arguments", e);
      // Ideally show toast error
    }
  }, [selectedTool, argsJson, onExecute]);

  return (
    <div className={cn("flex h-full", className)}>
      {/* Tool List */}
      <div className="w-1/3 border-r overflow-auto">
        <div className="p-4 font-semibold border-b">Tools</div>
        {tools.map((tool) => (
          <button
            key={tool.name}
            onClick={() => setSelectedTool(tool.name)}
            className={cn(
              "w-full text-left p-3 border-b hover:bg-muted/50 transition-colors flex items-start gap-2",
              selectedTool === tool.name && "bg-muted",
            )}
          >
            <Wrench className="h-4 w-4 mt-1 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <div className="font-medium truncate">{tool.name}</div>
              <div className="text-xs text-muted-foreground line-clamp-2">
                {tool.description}
              </div>
            </div>
          </button>
        ))}
        {tools.length === 0 && (
          <div className="p-4 text-center text-muted-foreground text-sm">
            No tools available
          </div>
        )}
      </div>

      {/* Tool Execution */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedTool ? (
          <div className="flex flex-col h-full">
            <div className="p-4 border-b bg-muted/10">
              <h3 className="font-bold flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                {selectedTool}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {tools.find((t) => t.name === selectedTool)?.description}
              </p>
            </div>
            <div className="flex-1 p-4 overflow-auto">
              <label className="block text-sm font-medium mb-2">
                Arguments (JSON)
              </label>
              <textarea
                className="w-full h-64 font-mono text-sm p-3 border rounded-md bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                value={argsJson}
                onChange={(e) => setArgsJson(e.target.value)}
                spellCheck={false}
              />
            </div>
            <div className="p-4 border-t flex justify-end">
              <Button onClick={handleExecute} disabled={!onExecute}>
                <Play className="h-4 w-4 mr-2" />
                Execute Tool
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a tool to view details
          </div>
        )}
      </div>
    </div>
  );
});
