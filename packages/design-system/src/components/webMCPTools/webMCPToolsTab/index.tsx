/**
 * External dependencies.
 */
import { PlusIcon } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

/**
 * Internal dependencies.
 */
import { Button } from '../../button';
import type { WebMCPTool } from '../types';
import { ToolList } from '../toolList';
import { EditToolDialog } from '../editToolDialog';
import OptionsPageTab from '../../optionsPageTab';

const BUILT_IN_TOOLS: WebMCPTool[] = [
    {
        name: "change_bg_color",
        namespace: "built_in",
        version: "1.0.0",
        description: "Changes background color",
        allowedDomains: ["<all_urls>"],
        inputSchema: { type: "object", properties: { color: { type: "string" } } },
        enabled: true,
        isBuiltIn: true
    },
    {
        name: "get_page_title",
        namespace: "built_in",
        version: "1.0.0",
        description: "Get page title",
        allowedDomains: ["<all_urls>"],
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

    useEffect(() => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.get(['userWebMCPTools', 'builtInWebMCPToolsState'], (result) => {
                if (result.userWebMCPTools && Array.isArray(result.userWebMCPTools)) {
                    setUserTools(result.userWebMCPTools as WebMCPTool[]);
                }

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
        <OptionsPageTab title="WebMCP Tools" description="Manage your custom scripts and tools." >
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
                        className="shadow-sm hover:shadow-md transition-all gap-2 bg-gray-900 hover:bg-gray-800 text-white"
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
            />

        </OptionsPageTab>
    )

}
