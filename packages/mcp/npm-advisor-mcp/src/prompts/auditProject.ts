/**
 * External dependencies.
 */
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Register the `audit-this-project` prompt. Returns a single user-role
 * message that walks the model through the audit workflow:
 * lockfile-aware analysis, severity bucketing, and a structured
 * upgrade plan. The prompt is just text — no side effects — so it can
 * be inspected by clients before the user accepts it.
 */
export function registerAuditProjectPrompt(server: McpServer): void {
  server.registerPrompt(
    "audit-this-project",
    {
      title: "Audit a project's npm dependencies",
      description:
        "Walks the model through analysing one project's package.json end-to-end: call analyze_package_json with the lockfile path so advisories reflect the actually-installed versions, then categorise findings by severity and propose a concrete upgrade plan.",
      argsSchema: {
        packageJsonPath: z
          .string()
          .min(1)
          .describe(
            "Absolute path to the project's package.json. The tool walks up from its directory to find the matching lockfile.",
          ),
        targetLicense: z
          .string()
          .optional()
          .describe(
            "SPDX license id of the consuming project (defaults to MIT). Used to compute the license-compatibility verdict per dep.",
          ),
      },
    },
    (args) => {
      const target = args.targetLicense ?? "MIT";
      const text = `You are auditing the npm dependencies of the project rooted at:

    ${args.packageJsonPath}

The consuming project's target license is **${target}**.

Run this exact workflow:

1. Call the \`analyze_package_json\` tool with:
   \`\`\`json
   {
     "packageJsonPath": "${args.packageJsonPath}",
     "targetLicense": "${target}"
   }
   \`\`\`
   The response will include a \`lockfilePath\` (when a lockfile was
   found) and a \`versionResolution\` flag on each dep ("lockfile"
   means the verdict reflects the installed version; "latest-fallback"
   means it reflects whatever is currently published — flag this
   distinction in your summary).

2. Group the per-dep results by severity tier:
   - **Block (critical)**: critical or high advisories on a
     production dependency.
   - **Fix soon (high)**: moderate advisories, license-incompatible
     deps, or maintained packages with very low responsiveness.
   - **Watch (low)**: replacement opportunities from the
     \`recommendations\` field, deps with low score but no advisories.

3. For each Block / Fix-soon item, propose a concrete next step:
   the patched version or the recommended replacement. Cite the
   advisory's URL when one is present in the per-dep \`securityAdvisories.issues\`.

4. Close with a one-sentence summary the user can paste into a PR
   description: "X critical, Y high, Z license-incompatible across
   N dependencies."

If \`analyze_package_json\` returns \`isError: true\`, surface the
\`error\` field verbatim and stop — don't guess at advisories without
data.`;
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
