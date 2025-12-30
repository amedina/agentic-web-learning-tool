import { useState, useEffect, useCallback } from 'react';
import { WebMCPToolsTab as WebMCPToolsUI, type WebMCPTool } from '@google-awlt/design-system';

const BUILT_IN_TOOLS: WebMCPTool[] = [
    {
        name: "change_bg_color",
        namespace: "built_in",
        description: "Changes background color",
        allowedDomains: ["<all_urls>"],
        inputSchema: { type: "object", properties: { color: { type: "string" } } },
        enabled: true,
        isBuiltIn: true
    },
    {
        name: "get_page_title",
        namespace: "built_in",
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

    return (
        <WebMCPToolsUI
            userTools={userTools}
            builtInTools={builtInTools}
            onSaveUserTools={saveUserTools}
            onSaveBuiltInState={saveBuiltInState}
        />
    );
}
