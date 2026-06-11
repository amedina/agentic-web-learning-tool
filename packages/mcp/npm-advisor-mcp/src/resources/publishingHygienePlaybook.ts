/**
 * External dependencies.
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * URI clients use to fetch the publishing-hygiene playbook resource.
 */
export const PUBLISHING_HYGIENE_PLAYBOOK_URI =
  "npm-advisor://publishing-hygiene-playbook";

/**
 * Markdown playbook mapping the publint message codes surfaced by
 * `analyze_project` to their root-cause fix. A model fixing publishing
 * issues should read this first so it edits configuration (package.json,
 * tsconfig, the bundler) rather than hand-patching generated files one
 * by one. Keep the codes here in sync with publint upstream.
 */
const PUBLISHING_HYGIENE_PLAYBOOK_MARKDOWN = `# Publishing-hygiene fix playbook

publint findings (\`source: "publint"\` in an \`analyze_project\` result)
describe how a package will behave once published to npm. Most of them
are **not** fixed by editing the offending file — they are fixed once,
at the configuration level. Use this map to go from a finding's \`code\`
to the real fix.

## Triage before you edit

1. **Skip third-party and generated files.** Ignore any finding whose
   \`file\` contains \`/node_modules/\` (that's a dependency's problem, not
   yours) or that points inside build output (\`dist/\`, \`build/\`,
   \`out/\`, \`.next/\`, \`lib/\`). You never hand-edit those — a thousand
   \`dist/\` findings almost always trace back to one wrong config value.
2. **Group by \`code\`.** A run with hundreds of findings usually has a
   handful of distinct codes. Fix the root cause for each code once.
3. **Fix config, then rebuild, then re-run \`analyze_project\`** to
   confirm the count dropped instead of editing files until the list
   looks empty.

## Code → root-cause fix

| publint code | What it means | Root-cause fix |
| --- | --- | --- |
| \`FILE_INVALID_FORMAT\` | A file is written in ESM but interpreted as CJS (or vice-versa) for its extension + the package's \`type\`. | If the package ships ESM, set \`"type": "module"\` in package.json. If it ships both, configure the bundler to emit \`.mjs\` for ESM output and \`.cjs\` for CJS output. Don't rename emitted files by hand — change the build config. |
| \`FILE_INVALID_EXPLICIT_FORMAT\` | A \`.cjs\`/\`.mjs\` file contains syntax that contradicts its explicit extension. | Make the bundler emit the extension that matches the format it actually produces (e.g. the ESM build should output \`.mjs\`). |
| \`USE_FILES\` | The published tarball includes internal tests/config/source that consumers don't need. | Add a \`files\` allowlist to package.json (e.g. \`["dist"]\`) — or a \`.npmignore\` — so only runtime artifacts ship. |
| \`FILE_DOES_NOT_EXIST\` | An \`exports\`/\`main\`/\`module\`/\`types\` entry points at a path not present in the package. | Fix the path, or ensure the build emits that file and that \`files\` includes it. |
| \`FILE_NOT_PUBLISHED\` | A referenced file exists locally but is excluded from the published tarball. | Add the file (or its directory) to the \`files\` allowlist. |
| \`MODULE_SHOULD_BE_ESM\` | A field that should reference ESM points at CJS. | Ship an ESM build and point the field (\`module\`/\`exports.import\`) at it. |
| \`HAS_ESM_MAIN_BUT_NO_EXPORTS\` | The package is ESM via \`main\` but has no \`exports\` map. | Add an \`exports\` field so entry points and conditions are explicit. |
| \`EXPORTS_TYPES_SHOULD_BE_FIRST\` | The \`types\` condition is not first in an \`exports\` entry. | Reorder so \`"types"\` is the first condition in that entry. |
| \`EXPORTS_DEFAULT_SHOULD_BE_LAST\` | The \`default\` condition is not last in an \`exports\` entry. | Move \`"default"\` to the end of that entry's condition list. |
| \`TYPES_NOT_EXPORTED\` | Types resolve via \`main\`/\`types\` but not through \`exports\`. | Add a \`"types"\` condition alongside \`import\`/\`require\` in \`exports\`. |
| \`EXPORTS_VALUE_INVALID\` | An \`exports\` value doesn't start with \`./\`. | Prefix the path with \`./\`. |
| \`DEPRECATED_FIELD_JSNEXT\` | Uses the deprecated \`jsnext:main\` / \`jsnext\` field. | Remove it and use \`module\` / \`exports\`. |

For codes not listed here, read the finding's \`message\` (publint phrases
each one with the concrete fix) and the docs at https://publint.dev/rules,
then apply the smallest configuration change that addresses the whole
group.
`;

/**
 * Register the publishing-hygiene playbook resource on a fresh
 * {@link McpServer}. Called once per session by the server factory.
 */
export function registerPublishingHygienePlaybookResource(
  server: McpServer,
): void {
  server.registerResource(
    "publishing-hygiene-playbook",
    PUBLISHING_HYGIENE_PLAYBOOK_URI,
    {
      title: "Publishing-hygiene fix playbook",
      description:
        "Markdown reference mapping the publint codes returned by analyze_project (FILE_INVALID_FORMAT, USE_FILES, EXPORTS_TYPES_SHOULD_BE_FIRST, …) to their root-cause configuration fix, plus triage guidance for skipping node_modules and build-output findings. Read this before fixing publishing-hygiene issues.",
      mimeType: "text/markdown",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.toString(),
          mimeType: "text/markdown",
          text: PUBLISHING_HYGIENE_PLAYBOOK_MARKDOWN,
        },
      ],
    }),
  );
}
