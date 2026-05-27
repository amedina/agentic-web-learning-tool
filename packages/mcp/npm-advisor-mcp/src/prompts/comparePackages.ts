/**
 * External dependencies.
 */
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Register the `compare-packages` prompt. Emits a user-role message
 * that instructs the model to call `get_package_stats` for each
 * package and assemble a head-to-head comparison along the axes
 * users actually care about (security, bundle, maintainability,
 * license fit).
 */
export function registerComparePackagesPrompt(server: McpServer): void {
  server.registerPrompt(
    "compare-packages",
    {
      title: "Compare two npm packages",
      description:
        "Drives a head-to-head comparison of two npm packages along security advisories, bundle size, maintainability, license compatibility, and modern replacements. Calls get_package_stats once per package and renders a recommendation.",
      argsSchema: {
        packageA: z
          .string()
          .min(1)
          .describe("First npm package to compare. Scoped or unscoped name."),
        packageB: z.string().min(1).describe("Second npm package to compare."),
        targetLicense: z
          .string()
          .optional()
          .describe(
            "SPDX license id of the consuming project (defaults to MIT). Used to compute each package's license-compatibility verdict.",
          ),
      },
    },
    (args) => {
      const target = args.targetLicense ?? "MIT";
      const text = `Compare these two npm packages head-to-head:

  A. **${args.packageA}**
  B. **${args.packageB}**

The consuming project's target license is **${target}**.

Run this exact workflow:

1. Call \`get_package_stats\` twice in parallel, once per package:
   \`\`\`json
   { "name": "${args.packageA}", "targetLicense": "${target}" }
   { "name": "${args.packageB}", "targetLicense": "${target}" }
   \`\`\`

2. Build a Markdown comparison table with one row per axis. Use the
   exact field names from the response so the user can verify each
   value:
   - Fitness score (\`score / scoreMaxPoints\`)
   - Open security advisories (\`securityAdvisories.critical/high/moderate/low\`)
   - Bundle gzipped size (\`bundle.gzip\`)
   - Last commit (\`lastCommitDate\`)
   - License + compatibility (\`license\`, \`licenseCompatibility\`)
   - Recommended replacements, if any (\`recommendations\`)

3. Pick a winner and justify in ≤3 sentences. Be honest about ties
   and missing data — if either package shows \`versionResolution:
   "latest-fallback"\` mention it; if a value is \`null\` (e.g.
   bundlephobia returned nothing) don't invent a number.

4. End with one actionable next step the user can take: "Switch to X
   if you need lockfile-friendly licenses" / "Both are safe; stay
   with whichever you've already adopted" / etc.

If either tool call returns \`isError: true\`, quote the \`error\`
field verbatim and abort the comparison.`;
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
