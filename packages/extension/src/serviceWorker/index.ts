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
        // 1. Unregister existing content scripts managed by this logic
        // We use specific IDs to manage them.
        try {
            await chrome.scripting.unregisterContentScripts({ ids: ['webmcp-polyfill'] });
        } catch (e) {
            // Ignore error if script doesn't exist
        }

        // 2. Register Polyfill Static Script
        // This ensures the global polyfill is always present in MAIN world
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

// Function to inject user scripts dynamically via executeScript
async function injectUserScripts(tabId: number, url: string) {
    try {
        const storage = await chrome.storage.local.get(["webmcp_user_scripts"]);
        const userScripts: WebMCPScript[] = storage["webmcp_user_scripts"] || [];

        for (const script of userScripts) {
            if (!script.enabled) continue;

            const matchPattern = script.metadata.match || '<all_urls>';
            // Simple glob matching support or use minimatch if imported
            // Since we are in service worker (Node/ESM context), we can use minimatch if bundled.
            // We configured 'es' build, so it should be fine.
            if (matchPattern === '<all_urls>' || minimatch(url, matchPattern)) {

                console.log(`[WebMCP] Injecting ${script.name} into tab ${tabId}`);

                // We inject a function that creates the module wrapper.
                // NOTE: Arguments must be JSON-serializable.
                await chrome.scripting.executeScript({
                    target: { tabId },
                    world: 'MAIN',
                    // We pass the code as an argument to avoid string escaping issues in 'func' body
                    args: [script.code],
                    func: async (code) => {
                        // This runs in the Page Context (MAIN world)
                        try {
                            // We re-use the Blob/Import trick.
                            // Limitation: Strict CSP might block 'blob:' or 'unsafe-inline'.
                            // If blocked, 'safe' execution is hard.
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

// Initial Registration of Polyfill
chrome.runtime.onInstalled.addListener(() => {
    updateRegisteredScripts();
});

chrome.runtime.onStartup.addListener(() => {
    updateRegisteredScripts();
});

// Watch for changes to re-register polyfill (if needed) or just logging
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes["webmcp_user_scripts"]) {
        // We don't need to re-register content scripts for user scripts
        // because we inject them dynamically on navigation.
        console.log("[WebMCP] User scripts updated.");
    }
});

// Listen for navigation to inject User Scripts
chrome.webNavigation.onCommitted.addListener((details) => {
    // Inject into main frame only? Or all frames? Typically main frame for tools.
    // Let's stick to main frame (frameId 0) for now.
    if (details.frameId === 0) {
        injectUserScripts(details.tabId, details.url);
    }
});