import '@mcp-b/global';
import { minimatch } from 'minimatch';

declare global {
    interface Window {
        mcp?: {
            registerTool: (tool: any) => void;
        };
    }
}

// Define the type for the stored script
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

/**
 * Injects and registers a WebMCP tool script into the current page context.
 */
async function injectScript(script: WebMCPScript) {
    try {
        console.log(`[WebMCP] Injecting tool: ${script.metadata.name}`);

        // Create a blob URL for the module to allow import
        const blob = new Blob([script.code], { type: 'text/javascript' });
        const url = URL.createObjectURL(blob);

        // Import the module dynamically
        const module = await import(url);

        // Clean up the URL
        URL.revokeObjectURL(url);

        // Register with global registry
        if (module.metadata && module.execute && typeof window.mcp !== 'undefined') {
            // @ts-ignore
            window.mcp.registerTool({
                ...module.metadata,
                execute: module.execute
            });
            console.log(`[WebMCP] Registered tool: ${module.metadata.name}`);
        } else {
            console.warn(`[WebMCP] Script ${script.name} executed but did not export metadata/execute or window.mcp is missing.`);
        }

    } catch (e) {
        console.error(`[WebMCP] Failed to inject script: ${script.name}`, e);
    }
}

async function init() {
    try {
        // We are in MAIN world, so we use sendMessage to get data from background
        // @ts-ignore - chrome.runtime.sendMessage is available in MAIN world
        const scripts = await chrome.runtime.sendMessage({ type: "getWebMCPScripts" });

        if (!scripts || !Array.isArray(scripts)) return;

        const currentUrl = window.location.href;

        for (const script of scripts) {
            if (!script.enabled) continue;

            // Check match pattern
            const pattern = script.metadata.match || "<all_urls>";
            if (pattern === "<all_urls>" || minimatch(currentUrl, pattern)) {
                await injectScript(script);
            }
        }
    } catch (err) {
        console.error("[WebMCP] Error initializing scripts:", err);
    }
}

init();