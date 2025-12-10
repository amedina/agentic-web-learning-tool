console.log("hello world");

import { minimatch } from 'minimatch';

interface WebMCPScript {
    id: string;
    name: string;
    code: string;
    enabled: boolean;
    metadata: {
        name?: string;
        version?: string;
        description?: string;
        match?: string;
    };
}

async function updateRegisteredScripts() {
    try {
        try {
            await chrome.scripting.unregisterContentScripts({ ids: ['webmcp-polyfill'] });
        } catch (e) {
        }

        await chrome.scripting.registerContentScripts([{
            id: 'webmcp-polyfill',
            matches: ['<all_urls>'],
            js: ['polyfill.js'],
            world: 'MAIN',
            runAt: 'document_start'
        }]);

        console.log("[WebMCP] Registered polyfill via scripting API.");

    } catch (e) {
        console.error("[WebMCP] Failed to update scripts:", e);
    }
}
async function injectUserScripts(tabId: number, url: string) {
    try {
        const storage = await chrome.storage.local.get(["webmcp_user_scripts"]);
        const userScripts: WebMCPScript[] = storage["webmcp_user_scripts"] || [];

        for (const script of userScripts) {
            if (!script.enabled) continue;

            const matchPattern = script.metadata.match || '<all_urls>';
            if (matchPattern === '<all_urls>' || minimatch(url, matchPattern)) {

                console.log(`[WebMCP] Injecting ${script.name} into tab ${tabId}`);

                await chrome.scripting.executeScript({
                    target: { tabId },
                    world: 'MAIN',
                    args: [script.code],
                    func: async (code) => {
                        try {
                            const blob = new Blob([code], { type: 'text/javascript' });
                            const blobUrl = URL.createObjectURL(blob);

                            try {
                                const mod = await import(blobUrl);
                                URL.revokeObjectURL(blobUrl);

                                // @ts-ignore
                                if (mod.metadata && mod.execute && window.mcp) {
                                    // @ts-ignore
                                    window.mcp.registerTool({
                                        ...mod.metadata,
                                        execute: mod.execute
                                    });
                                }
                            } catch (err) {
                                console.error("[WebMCP] Module import failed (likely CSP):", err);
                            }
                        } catch (e) {
                            console.error("[WebMCP] Script execution wrapper error:", e);
                        }
                    }
                });
            }
        }
    } catch (e) {
        console.error("[WebMCP] Injection failed:", e);
    }
}
chrome.runtime.onInstalled.addListener(() => {
    updateRegisteredScripts();
});

chrome.runtime.onStartup.addListener(() => {
    updateRegisteredScripts();
});
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes["webmcp_user_scripts"]) {
        console.log("[WebMCP] User scripts updated.");
    }
});
chrome.webNavigation.onCommitted.addListener((details) => {
    if (details.frameId === 0) {
        injectUserScripts(details.tabId, details.url);
    }
});