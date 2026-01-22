/**
 * External dependencies.
 */
import { PlusIcon } from 'lucide-react';
import { useCallback, useState } from 'react';

/**
 * Internal dependencies.
 */
import { Button } from '../../button';
import type { WebMCPTool } from '../types';
import { ToolList } from '../toolList';
import { EditToolDialog } from '../editToolDialog';
import OptionsPageTab from '../../optionsPageTab';

interface WebMCPToolsTabProps {
  userTools: WebMCPTool[];
  builtInTools: WebMCPTool[];
  onSaveUserTools: (tools: WebMCPTool[]) => void;
  onSaveBuiltInState: (tools: WebMCPTool[]) => void;
  isDarkMode?: boolean;
  saveExtensionToolsState: (toolName: string, value: boolean) => void;
}

export function WebMCPToolsTab({
  userTools,
  builtInTools,
  onSaveUserTools,
  onSaveBuiltInState,
  isDarkMode,
  saveExtensionToolsState,
}: WebMCPToolsTabProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<WebMCPTool | undefined>(
    undefined
  );

  const handleSaveTool = useCallback(
    (tool: WebMCPTool) => {
      let newTools = [...userTools];

      if (editingTool) {
        const index = newTools.findIndex((t) => t.name === editingTool.name);
        if (index >= 0) {
          newTools[index] = tool;
        } else {
          newTools.push(tool);
        }
      } else {
        // Creating new
        const existingIndex = newTools.findIndex((t) => t.name === tool.name);
        if (existingIndex >= 0) {
          newTools[existingIndex] = tool;
        } else {
          newTools.push(tool);
        }
      }

      onSaveUserTools(newTools);
    },
    [editingTool, userTools, onSaveUserTools]
  );

  const handleToggleTool = useCallback(
    (tool: WebMCPTool, enabled: boolean) => {
      if (tool.isBuiltIn) {
        if (tool.isExtension) {
          saveExtensionToolsState(tool.name, enabled);
          return;
        }

        const newTools = builtInTools
          .filter((tool) => !tool.isExtension)
          .map((t) => (t.name === tool.name ? { ...t, enabled } : t));
        onSaveBuiltInState(newTools);
      } else {
        const newTools = userTools.map((t) =>
          t.name === tool.name ? { ...t, enabled } : t
        );
        onSaveUserTools(newTools);
      }
    },
    [onSaveBuiltInState, onSaveUserTools, builtInTools, userTools]
  );

  const handleDeleteTool = useCallback(
    (tool: WebMCPTool) => {
      const newTools = userTools.filter((t) => t.name !== tool.name);
      onSaveUserTools(newTools);
      setIsEditDialogOpen(false);
    },
    [onSaveUserTools, userTools]
  );

  return (
    <OptionsPageTab
      title="WebMCP Tools"
      description="Manage your custom scripts and tools."
    >
      <ToolList
        userTools={userTools}
        builtInTools={builtInTools}
        onToggleTool={handleToggleTool}
        onEditTool={(tool) => {
          setEditingTool(tool);
          setIsEditDialogOpen(true);
        }}
        onNewTool={() => {
          setEditingTool(undefined);
          setIsEditDialogOpen(true);
        }}
        newScriptButton={
          <Button
            className="shadow-sm hover:shadow-md transition-all gap-2"
            onClick={() => {
              setEditingTool(undefined);
              setIsEditDialogOpen(true);
            }}
          >
            <PlusIcon size={16} />
            New Script
          </Button>
        }
      />

      <EditToolDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        tool={editingTool}
        onSave={handleSaveTool}
        onDelete={editingTool ? handleDeleteTool : undefined}
        isDarkMode={isDarkMode}
      />
    </OptionsPageTab>
  );
}
