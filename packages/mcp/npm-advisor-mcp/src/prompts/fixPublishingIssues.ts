/**
 * External dependencies.
 */
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Internal dependencies.
 */
import { PUBLISHING_HYGIENE_PLAYBOOK_URI } from "../resources/publishingHygienePlaybook";

/**
 * Register the `fix-publishing-issues` prompt. Emits a single user-role
 * message that walks the model through resolving a project's
 * publishing-hygiene (publint) findings: run analyze_project, drop the
 * non-actionable findings, group what's left by root cause, apply the
 * config-level fix from the playbook, and re-verify. The prompt is just
 * text — no side effects — so a client can inspect it before accepting.
 */
export function registerFixPublishingIssuesPrompt(server: McpServer): void {
  server.registerPrompt(
    "fix-publishing-issues",
    {
      title: "Fix a project's publishing-hygiene issues",
      description:
        "Walks the model through fixing the publint findings from analyze_project: skip node_modules and build-output findings, group the rest by root cause, apply the config-level fix (package.json type/exports/files, bundler output) from the publishing-hygiene playbook, then re-run to verify the count dropped.",
      argsSchema: {
        rootPath: z
          .string()
          .min(1)
          .describe(
            "Absolute path to the project root (the directory containing package.json) whose publishing-hygiene issues should be fixed.",
          ),
      },
    },
    (args) => {
      const text = `You are fixing the publishing-hygiene issues of the project rooted at:

    ${args.rootPath}

These are the findings publint produces — problems that would break or
bloat the package once it's published to npm.

Run this exact workflow:

1. Read the playbook resource \`${PUBLISHING_HYGIENE_PLAYBOOK_URI}\`
   first. It maps each publint \`code\` to its root-cause fix and tells
   you which findings to ignore.

2. Call the \`analyze_project\` tool with:
   \`\`\`json
   {
     "rootPath": "${args.rootPath}",
     "skipReplacements": true
   }
   \`\`\`
   Work only with findings where \`source\` is \`"publint"\`.

3. **Triage — do not fix everything.** Discard any finding whose
   \`file\` contains \`/node_modules/\` (a dependency's problem, not the
   user's) or that points inside build output (\`dist/\`, \`build/\`,
   \`out/\`, \`.next/\`, \`lib/\`). Generated files are never edited by
   hand — a large count there almost always traces back to one wrong
   configuration value.

4. Group the remaining actionable findings by their \`code\`. For each
   group, apply the single root-cause fix the playbook prescribes —
   typically an edit to \`package.json\` (\`type\`, \`exports\`, \`files\`),
   \`tsconfig.json\`, or the bundler config — not a per-file edit.

5. Show the proposed diff for each fix and get the user's confirmation
   before writing anything. Make the smallest change that resolves the
   whole group.

6. After applying (and rebuilding, if the fix was a build-config
   change), call \`analyze_project\` again with the same arguments and
   report the before/after publint count so the user can see the
   issues actually cleared.

If \`analyze_project\` returns \`isError: true\`, surface the \`error\`
field verbatim and stop — don't guess at fixes without findings.`;
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
