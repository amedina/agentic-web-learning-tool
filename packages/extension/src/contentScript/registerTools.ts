// @ts-nocheck
(function () {
    console.log("WebMCP: register-tools.js loaded (Diagnostic Version 2.0)");

    function register() {
        const mcp = window.navigator.modelContext;
        const mcpTesting = window.navigator.modelContextTesting;

        if (!mcp) {
            console.error("WebMCP: navigator.modelContext missing");
            setTimeout(register, 500); // Retry
            return;
        }

        console.log("WebMCP: Registering tools...");

        try {
            mcp.registerTool({
                name: "change_bg_color",
                description: "Changes background color",
                inputSchema: { type: "object", properties: { color: { type: "string" } } },
                execute: async (args) => {
                    console.log("WebMCP: Executing change_bg_color", args);
                    const color = args.color || "red";
                    document.body.style.backgroundColor = color;
                    // WORKAROUND: Return string directly to avoid [object Object] from Native API
                    return `Changed background to ${color}`;
                }
            });

            mcp.registerTool({
                name: "get_page_title",
                description: "Get page title",
                inputSchema: { type: "object", properties: {} },
                execute: async () => {
                    console.log("WebMCP: Executing get_page_title");
                    // WORKAROUND: Return string directly to avoid [object Object] from Native API
                    return "Page Title: " + document.title;
                }
            });

            console.log("WebMCP: Tools registered.");
        } catch (e) {
            console.error("WebMCP: Registration failed", e);
        }

        // Message Listener
        window.addEventListener("message", async (event) => {
            if (event.source !== window) return;
            if (!event.data || event.data.type !== "EXECUTE_WEBMCP_TOOL") return;

            const { id, toolName, args } = event.data;
            console.log(`WebMCP: Request received for ${toolName}`, args);

            // Executor Selection
            const executor = (mcpTesting && typeof mcpTesting.executeTool === 'function')
                ? mcpTesting
                : mcp;

            console.log(`WebMCP: Using executor ${executor === mcpTesting ? 'TestingAPI' : 'ProviderAPI'}`);

            try {
                // Ensure args is string if needed (polyfil quirk)
                const argsString = typeof args === 'string' ? args : JSON.stringify(args);

                // EXECUTE
                const rawResult = await executor.executeTool(toolName, argsString);
                console.log("WebMCP: Raw result:", rawResult);

                // NORMALIZE
                let normalizedResult;

                if (rawResult && typeof rawResult === 'object' && ('content' in rawResult || 'isError' in rawResult)) {
                    // It's a valid MCP envelope
                    normalizedResult = rawResult;
                    console.log("WebMCP: Result is valid envelope");
                } else if (typeof rawResult === 'string') {
                    // It's a plain string
                    normalizedResult = { content: [{ type: "text", text: rawResult }] };
                    console.log("WebMCP: Result is string, wrapped.");
                } else {
                    // Fallback
                    const stringified = JSON.stringify(rawResult, null, 2);
                    normalizedResult = { content: [{ type: "text", text: stringified }] };
                    console.log("WebMCP: Result is unknown, stringified:", stringified);
                }

                console.log("WebMCP: Sending response:", normalizedResult);

                window.postMessage({
                    type: "WEBMCP_TOOL_RESULT",
                    id,
                    result: normalizedResult
                }, "*");

            } catch (err) {
                console.error("WebMCP: Execution error", err);
                window.postMessage({
                    type: "WEBMCP_TOOL_RESULT",
                    id,
                    error: err.message
                }, "*");
            }
        });

        // Listen for User Defined Tools from Content Script (mcpBridge.ts)
        window.addEventListener("message", async (event) => {
            if (event.source !== window) return;
            if (!event.data || event.data.type !== "REGISTER_USER_TOOLS") return;

            const tools = event.data.tools;
            if (!tools || !Array.isArray(tools)) return;

            console.log("WebMCP: Received user tools to register", tools.length);

            for (const toolWrapper of tools) {
                try {
                    // 1. Create a Blob from the code string
                    const blob = new Blob([toolWrapper.code], { type: 'text/javascript' });
                    const url = URL.createObjectURL(blob);

                    // 2. Dynamically import the blob as a module
                    // This works because we stripped CSP headers
                    const module = await import(url);

                    // 3. Construct the tool object
                    const toolToRegister = {
                        ...module.metadata,
                        execute: module.execute
                    };

                    // 4. Register
                    if (mcp) {
                        await mcp.registerTool(toolToRegister);
                        console.log("WebMCP: User tool registered successfully:", toolToRegister.name);
                    } else {
                        console.error("WebMCP: Cannot register tool, mcp missing");
                    }

                    // Clean up
                    URL.revokeObjectURL(url);
                } catch (err) {
                    console.error('WebMCP: Failed to register user tool:', toolWrapper.name, err);
                }
            }
        });
    }

    if (window.navigator.modelContext) {
        register();
    } else {
        setTimeout(register, 100);
    }
})();
