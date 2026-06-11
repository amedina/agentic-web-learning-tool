/**
 * External dependencies.
 */
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Register the `fix-circular-dependencies` prompt. Emits a single
 * user-role message that walks the model through resolving the import
 * cycles madge reports: run analyze_project, inspect each cycle's edge
 * list, break the offending back-edge with the least-invasive
 * refactor, and re-verify without introducing new cycles. The prompt
 * is just text — no side effects — so a client can inspect it before
 * accepting.
 */
export function registerFixCircularDependenciesPrompt(server: McpServer): void {
  server.registerPrompt(
    "fix-circular-dependencies",
    {
      title: "Fix a project's circular dependencies",
      description:
        "Walks the model through breaking the import cycles from analyze_project: inspect each cycle's edges, pick the least-invasive break (type-only import, extract a shared leaf module, invert the dependency, or defer the import), apply it, then re-run to confirm cycles cleared without adding new ones.",
      argsSchema: {
        rootPath: z
          .string()
          .min(1)
          .describe(
            "Absolute path to the project root (the directory containing package.json) whose circular dependencies should be fixed.",
          ),
      },
    },
    (args) => {
      const text = `You are fixing the circular dependencies of the project rooted at:

    ${args.rootPath}

Import cycles cause subtle runtime ordering bugs (undefined exports),
break tree-shaking, and make refactors riskier.

Run this exact workflow:

1. Call the \`analyze_project\` tool with:
   \`\`\`json
   {
     "rootPath": "${args.rootPath}",
     "skipPublint": true,
     "skipReplacements": true
   }
   \`\`\`
   Work only with findings where \`source\` is \`"circular-deps"\`. Each
   finding's \`data\` carries \`cycleRelative\` (the file chain),
   \`edges\`, and \`cycleLength\`.

2. For each cycle, open the files in the chain and identify the single
   import edge that closes the loop (the back-edge). Then pick the
   least-invasive way to break it:
   - **Type-only import**: if the cyclic import is used only for types,
     change it to \`import type\` so it's erased at build time.
   - **Extract a shared leaf module**: move the symbol both files fight
     over into a new module that neither imports back.
   - **Invert the dependency**: pass the needed value in (parameter /
     injection) instead of importing it.
   - **Defer the import**: move a \`require\`/dynamic \`import()\` inside
     the function that needs it when the cycle is only a load-time
     problem.

3. Apply the smallest change per cycle. Show the diff and get the
   user's confirmation before writing. Prefer fixing several cycles
   that share a file with one well-placed extraction over many
   scattered edits.

4. After applying, call \`analyze_project\` again with the same
   arguments and confirm the cycle count dropped. Watch for any **new**
   cycle your refactor introduced and resolve it before finishing.

If \`analyze_project\` returns \`isError: true\`, surface the \`error\`
field verbatim and stop — don't guess at cycles without findings.`;
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text,
            },
          },
        ],
      };
    },
  );
}
