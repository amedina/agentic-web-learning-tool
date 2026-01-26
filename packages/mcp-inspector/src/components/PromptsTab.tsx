/**
 * External dependencies
 */
import { useEffect, useState, useCallback } from "react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Combobox,
  Label,
  TabsContent,
} from "@google-awlt/design-system";
import {
  type ListPromptsResult,
  type ResourceTemplateReference,
  type PromptReference,
} from "@modelcontextprotocol/sdk/types.js";
import { AlertCircle, ChevronRight, MessageSquare } from "lucide-react";

/**
 * Internal dependencies
 */
import ListPane from "./ListPane";
import JsonView from "./JsonView";
import IconDisplay, { type WithIcons } from "./IconDisplay";
import { useCompletionState } from "../lib/hooks/useCompletionState";

export type Prompt = {
  name: string;
  description?: string;
  arguments?: {
    name: string;
    description?: string;
    required?: boolean;
  }[];
  icons?: {
    src: string;
    mimeType?: string;
    sizes?: string[];
    theme?: "light" | "dark";
  }[];
};

const PromptsTab = ({
  prompts,
  listPrompts,
  clearPrompts,
  getPrompt,
  selectedPrompt,
  setSelectedPrompt,
  handleCompletion,
  completionsSupported,
  promptContent,
  nextCursor,
  error,
}: {
  prompts: Prompt[];
  listPrompts: () => void;
  clearPrompts: () => void;
  getPrompt: (name: string, args: Record<string, string>) => void;
  selectedPrompt: Prompt | null;
  setSelectedPrompt: (prompt: Prompt | null) => void;
  handleCompletion: (
    ref: ResourceTemplateReference | PromptReference,
    argName: string,
    value: string,
    context?: Record<string, string>,
  ) => Promise<string[]>;
  completionsSupported: boolean;
  promptContent: string;
  nextCursor: ListPromptsResult["nextCursor"];
  error: string | null;
}) => {
  const [promptArgs, setPromptArgs] = useState<Record<string, string>>({});

  const { completions, clearCompletions, requestCompletions } =
    useCompletionState(handleCompletion, completionsSupported);

  useEffect(() => {
    clearCompletions();
  }, [clearCompletions]);

  const handleArgChange = useCallback(
    async (key: string, value: string) => {
      setPromptArgs((prev) => ({ ...prev, [key]: value }));

      if (selectedPrompt) {
        requestCompletions(
          {
            type: "ref/prompt",
            name: selectedPrompt.name,
          },
          key,
          value,
          promptArgs,
        );
      }
    },
    [promptArgs, requestCompletions, selectedPrompt],
  );

  const handleClearPrompts = useCallback(() => {
    clearPrompts();
    setSelectedPrompt(null);
  }, [clearPrompts, setSelectedPrompt]);

  const handleSetSelectedPrompt = useCallback(
    (prompt: Prompt) => {
      setSelectedPrompt(prompt);
      setPromptArgs({});
    },
    [setSelectedPrompt],
  );

  const handleGetPrompt = useCallback(() => {
    if (selectedPrompt) {
      getPrompt(selectedPrompt.name, promptArgs);
    }
  }, [getPrompt, selectedPrompt, promptArgs]);

  return (
    <TabsContent value="prompts">
      <div className="grid grid-cols-2 gap-4">
        <ListPane
          items={prompts}
          listItems={listPrompts}
          clearItems={handleClearPrompts}
          setSelectedItem={handleSetSelectedPrompt}
          renderItem={(prompt) => (
            <div className="flex items-center w-full">
              <IconDisplay icons={(prompt as WithIcons).icons} size="sm" />
              {!(prompt as WithIcons).icons && (
                <MessageSquare className="w-4 h-4 mr-2 flex-shrink-0 text-gray-500" />
              )}
              <span className="flex-1 truncate">{prompt.name}</span>
              <ChevronRight className="w-4 h-4 flex-shrink-0 text-gray-400" />
            </div>
          )}
          title="Prompts"
          buttonText={nextCursor ? "List More Prompts" : "List Prompts"}
          isButtonDisabled={!nextCursor && prompts.length > 0}
        />

        <div className="bg-card border border-border rounded-lg shadow">
          <div className="p-4 border-b border-gray-200 dark:border-border flex items-center gap-2">
            {selectedPrompt && (
              <IconDisplay
                icons={(selectedPrompt as WithIcons).icons}
                size="md"
              />
            )}
            <h3 className="font-semibold">
              {selectedPrompt ? selectedPrompt.name : "Select a prompt"}
            </h3>
          </div>
          <div className="p-4">
            {selectedPrompt ? (
              <div className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription className="break-all">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedPrompt.description}
                </p>
                {selectedPrompt.arguments?.map((arg) => (
                  <div key={arg.name}>
                    <Label htmlFor={arg.name}>
                      {arg.name}
                      {arg.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </Label>
                    <Combobox
                      id={arg.name}
                      placeholder={arg.description || `Enter ${arg.name}`}
                      value={promptArgs[arg.name] || ""}
                      onChange={(value) => handleArgChange(arg.name, value)}
                      onInputChange={(value) =>
                        handleArgChange(arg.name, value)
                      }
                      options={completions[arg.name] || []}
                    />
                  </div>
                ))}
                <Button
                  onClick={handleGetPrompt}
                  disabled={
                    selectedPrompt.arguments?.some(
                      (arg) => arg.required && !promptArgs[arg.name],
                    ) || false
                  }
                >
                  Get Prompt
                </Button>
                {promptContent && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold mb-2">Result:</h4>
                    <JsonView data={promptContent} />
                  </div>
                )}
              </div>
            ) : (
              <Alert>
                <AlertDescription>
                  Select a prompt from the list to view its details and get it
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </div>
    </TabsContent>
  );
};

export default PromptsTab;
