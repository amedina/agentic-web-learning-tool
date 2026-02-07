/**
 * Internal dependencies.
 */
import { builtInTools } from './tools/index';

// @ts-nocheck
(function () {
  console.log('WebMCP: register-tools.js loaded (Diagnostic Version 2.0)');

  function register() {
    const mcp = (window.navigator as any).modelContext;
    const mcpTesting = (window.navigator as any).modelContextTesting;

    if (!mcp) {
      console.error('WebMCP: navigator.modelContext missing');
      setTimeout(register, 500); // Retry
      return;
    }

    console.log('WebMCP: Registering tools...');

    try {
      for (const tool of builtInTools) {
        if (!mcp?.toolRegistrationTimestamps?.has(tool.name)) {
          mcp.registerTool(tool);
        }
      }

      console.log('WebMCP: Tools registered.');
    } catch (e) {
      console.error('WebMCP: Registration failed', e);
    }

    // Message Listener
    window.addEventListener('message', async (event) => {
      if (event.source !== window) return;
      if (!event.data || event.data.type !== 'EXECUTE_WEBMCP_TOOL') return;

      const { id, toolName, args } = event.data;
      console.log(`WebMCP: Request received for ${toolName}`, args);

      // Executor Selection
      const executor =
        mcpTesting && typeof mcpTesting.executeTool === 'function'
          ? mcpTesting
          : mcp;

      console.log(
        `WebMCP: Using executor ${executor === mcpTesting ? 'TestingAPI' : 'ProviderAPI'}`
      );

      try {
        // Ensure args is string if needed (polyfil quirk)
        const argsString =
          typeof args === 'string' ? args : JSON.stringify(args);

        // EXECUTE
        const rawResult = await executor.executeTool(toolName, argsString);
        console.log('WebMCP: Raw result:', rawResult);

        // NORMALIZE
        let normalizedResult;

        if (
          rawResult &&
          typeof rawResult === 'object' &&
          ('content' in rawResult || 'isError' in rawResult)
        ) {
          // It's a valid MCP envelope
          normalizedResult = rawResult;
          console.log('WebMCP: Result is valid envelope');
        } else if (typeof rawResult === 'string') {
          // It's a plain string
          normalizedResult = {
            content: [{ type: 'text', text: rawResult }],
          };
          console.log('WebMCP: Result is string, wrapped.');
        } else {
          // Fallback
          const stringified = JSON.stringify(rawResult, null, 2);
          normalizedResult = {
            content: [{ type: 'text', text: stringified }],
          };
          console.log('WebMCP: Result is unknown, stringified:', stringified);
        }

        console.log('WebMCP: Sending response:', normalizedResult);

        window.postMessage(
          {
            type: 'WEBMCP_TOOL_RESULT',
            id,
            result: normalizedResult,
          },
          '*'
        );
      } catch (err: any) {
        console.error('WebMCP: Execution error', err);
        window.postMessage(
          {
            type: 'WEBMCP_TOOL_RESULT',
            id,
            error: err.message,
          },
          '*'
        );
      }
    });
  }

  if ((window.navigator as any).modelContext) {
    register();
  } else {
    setTimeout(register, 100);
  }
})();
