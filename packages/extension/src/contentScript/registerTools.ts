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

      const mcpTestingTools = mcpTesting?.listTools?.();

      if (mcpTestingTools) {
        for (const tool of mcpTestingTools) {
          if (!mcp?.toolRegistrationTimestamps?.has(tool.name)) {
            tool.execute = async (args: any) => {
              console.log('WebMCP: Executing tool', tool.name, args);

              let targetFrame: HTMLIFrameElement | null = null;
              let loadPromise: Promise<void> | null = null;

              const formTarget = document.querySelector(
                `form[toolname="${tool.name}"]`
                // @ts-ignore
              )?.target;

              if (formTarget) {
                targetFrame = document.querySelector(`[name=${formTarget}]`);
                loadPromise = new Promise((resolve) => {
                  targetFrame?.addEventListener('load', () => resolve(), {
                    once: true,
                  });
                });
              }

              // Execute the experimental tool
              // @ts-ignore
              const promise = navigator.modelContextTesting.executeTool(
                tool.name,
                args
              );

              try {
                let result = await promise;

                // If result is null and we have a target frame, wait for the frame to reload.
                if (result === null && targetFrame) {
                  console.log(
                    `WebMCP: Waiting for form target ${targetFrame} to load`
                  );

                  await loadPromise;

                  console.debug(
                    'WebMCP: Get cross document script tool result'
                  );

                  // @ts-ignore
                  result =
                    // @ts-ignore
                    await targetFrame?.contentWindow?.navigator.modelContextTesting.getCrossDocumentScriptToolResult();
                }

                return result;
              } catch (error) {
                console.error('WebMCP: Error executing tool', tool.name, error);
                // @ts-ignore
                return JSON.stringify(error.message);
              }
            };

            mcp.registerTool(tool);
          }
        }
      }

      console.log('WebMCP: Tools registered.');
    } catch (e) {
      console.error('WebMCP: Registration failed', e);
    }
  }

  if ((window.navigator as any).modelContext) {
    register();
  } else {
    setTimeout(register, 100);
  }
})();
