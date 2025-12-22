/**
 * External dependencies.
 */
import { PlusIcon } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

/**
 * Internal dependencies.
 */
import { Button } from '../../../index';
import type { WebMCPTool } from '../types';
import { ToolList } from '../ToolList';
import { EditToolDialog } from '../EditToolDialog';


const BUILT_IN_TOOLS: WebMCPTool[] = [
    {
        name: "change_bg_color",
        namespace: "built_in",
        version: "1.0.0",
        description: "Changes background color",
        matchPatterns: ["<all_urls>"],
        inputSchema: { type: "object", properties: { color: { type: "string" } } },
        enabled: true,
        isBuiltIn: true
    },
    {
        name: "get_page_title",
        namespace: "built_in",
        version: "1.0.0",
        description: "Get page title",
        matchPatterns: ["<all_urls>"],
        inputSchema: { type: "object", properties: {} },
        enabled: true,
        isBuiltIn: true
    }
];

export function WebMCPToolsTab() {
    const [userTools, setUserTools] = useState<WebMCPTool[]>([]);
    const [builtInTools, setBuiltInTools] = useState<WebMCPTool[]>(BUILT_IN_TOOLS);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingTool, setEditingTool] = useState<WebMCPTool | undefined>(undefined);

    // Load tools from storage
    useEffect(() => {
        // Load user tools
        // Check if chrome.storage is available (it might not be in Storybook/design system env)
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.get(['userWebMCPTools', 'builtInWebMCPToolsState'], (result) => {
                if (result.userWebMCPTools && Array.isArray(result.userWebMCPTools)) {
                    setUserTools(result.userWebMCPTools as WebMCPTool[]);
                }

                // Restore built-in tool states
                if (result.builtInWebMCPToolsState) {
                    const states = result.builtInWebMCPToolsState as Record<string, boolean>;
                    setBuiltInTools(prev => prev.map(t => ({
                        ...t,
                        enabled: states[t.name] !== undefined ? states[t.name] : true
                    })));
                }
            });
        }
    }, []);

    // Save updates to storage
    const saveUserTools = useCallback((tools: WebMCPTool[]) => {
        setUserTools(tools);
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.set({ userWebMCPTools: tools });
        }
    }, []);

    const saveBuiltInState = useCallback((tools: WebMCPTool[]) => {
        setBuiltInTools(tools);
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            const states = tools.reduce<Record<string, boolean>>((acc, t) => ({ ...acc, [t.name]: t.enabled }), {});
            chrome.storage.local.set({ builtInWebMCPToolsState: states });
        }
    }, []);

    const handleSaveTool = (tool: WebMCPTool) => {
        // Check if updating existing or adding new
        // We use name as ID for now. TODO: better ID system?
        // Note: tool.name from user input might change. 
        // If we are editing "foo" and rename to "bar", we should ideally update "foo".
        // But for this simple implementation, if name matches existing, update it.
        // If editingTool is set, we can match by original name?

        let newTools = [...userTools];

        if (editingTool) {
            const index = newTools.findIndex(t => t.name === editingTool.name);
            if (index >= 0) {
                newTools[index] = tool;
            } else {
                newTools.push(tool);
            }
        } else {
            // Creating new
            const existingIndex = newTools.findIndex(t => t.name === tool.name);
            if (existingIndex >= 0) {
                newTools[existingIndex] = tool;
            } else {
                newTools.push(tool);
            }
        }

        saveUserTools(newTools);
    };

    const handleToggleTool = (tool: WebMCPTool, enabled: boolean) => {
        if (tool.isBuiltIn) {
            const newTools = builtInTools.map(t => t.name === tool.name ? { ...t, enabled } : t);
            saveBuiltInState(newTools);
        } else {
            const newTools = userTools.map(t => t.name === tool.name ? { ...t, enabled } : t);
            saveUserTools(newTools);
        }
    };

    const handleDeleteTool = (tool: WebMCPTool) => {
        const newTools = userTools.filter(t => t.name !== tool.name);
        saveUserTools(newTools);
        setIsEditDialogOpen(false);
    };

    return (
        <div className="p-8 max-w-5xl mx-auto w-full">
            <div className="flex justify-between items-start mb-8 border-b border-gray-200 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">WebMCP Tools</h1>
                    <p className="text-gray-500">Manage your custom scripts and tools.</p>
                </div>
                <Button
                    className="shadow-sm hover:shadow-md transition-all gap-2 bg-gray-900 hover:bg-gray-800 text-white"
                    onClick={() => {
                        setEditingTool(undefined);
                        setIsEditDialogOpen(true);
                    }}
                >
                    <PlusIcon size={16} />
                    New Script
                </Button>
            </div>

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
            />

            <EditToolDialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                tool={editingTool}
                onSave={handleSaveTool}
                onDelete={editingTool ? handleDeleteTool : undefined}
            />
        </div>
    );
}
