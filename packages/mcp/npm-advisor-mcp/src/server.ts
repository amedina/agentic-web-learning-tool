/**
 * Internal dependencies (must come first).
 */
// Side-effect import: rebinds console.* to stderr before anything else
// loads, so analyzer-core's `console.log({...})` doesn't corrupt the
// MCP JSON-RPC stream on stdout. See redirectConsoleToStderr.ts.
import "./redirectConsoleToStderr";

/**
 * External dependencies.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { configureGithubAuth } from "@agentic-web-labs/package-analyzer-core";
import { z } from "zod";

/**
 * Internal dependencies.
 */
import { parseCliArgs } from "./lib/parseCliArgs";
import { runTool } from "./lib/toolRunner";
import { runAnalyzePackageJson } from "./tools/analyzePackageJson";
import { runAnalyzeProject } from "./tools/analyzeProject";
import { runGetPackageStats } from "./tools/getPackageStats";
import { runListKnownProjects } from "./tools/listKnownProjects";
import { runListWorkspaceDependencies } from "./tools/listWorkspaceDependencies";
import { startHttpServer } from "./transports/httpTransport";

const SERVER_NAME = "npm-advisor";
const SERVER_VERSION = "0.1.0";

/**
 * Wires analyzer-core's githubFetch to a $GITHUB_TOKEN env var when
 * one is set, lifting the unauthenticated 60-req/hr REST limit to
 * 5 000-req/hr for users running this server out of CI or a shell
 * with a personal access token in their environment. No token is
 * fine — the server simply runs unauthenticated.
 */
function configureAuthFromEnv(): void {
  const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN ?? null;
  configureGithubAuth({
    getToken: async () => token,
  });
  // Logged to stderr (never stdout — that's the JSON-RPC stream) so users
  // can confirm whether their MCP client actually passed the env var
  // through; missing $GITHUB_TOKEN is the most common cause of premature
  // rate-limit failures during a workspace audit.
  const source = process.env.GITHUB_TOKEN
    ? "GITHUB_TOKEN"
    : process.env.GH_TOKEN
      ? "GH_TOKEN"
      : null;
  const message = source
    ? `npm-advisor-mcp: GitHub auth = token (from $${source}); rate limit 5,000 req/hr`
    : `npm-advisor-mcp: GitHub auth = unauthenticated; rate limit 60 req/hr (set $GITHUB_TOKEN to lift)`;
  process.stderr.write(`${message}\n`);
}

/**
 * Builds the MCP server, registers every tool, and connects it to
 * stdio. Exported so tests can construct a server without invoking
 * the side-effectful entry point at the bottom of the file.
 */
export async function createServer(): Promise<McpServer> {
  configureAuthFromEnv();

  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  server.registerTool(
    "get_package_stats",
    {
      title: "Get npm package stats",
      description:
        "Fetches comprehensive stats for a single npm package: Fitness score, security advisories, license + compatibility verdict against the project's target license, bundle size, GitHub stars + last commit, and replacement recommendations from e18e. Use this when the user asks about a specific package by name. When presenting results, render a rich visual artifact (HTML or React) with metric cards for the key stats (score, bundle size, license, last commit) and a score breakdown chart.",
      inputSchema: {
        name: z
          .string()
          .min(1)
          .describe("npm package name, e.g. 'lodash' or '@types/node'."),
        targetLicense: z
          .string()
          .optional()
          .describe(
            "SPDX license id of the consuming project (defaults to MIT). Used to compute the license-compatibility verdict.",
          ),
        includeDependencyTree: z
          .boolean()
          .optional()
          .describe(
            "If true, include the recursive dependency tree (slower; large output). Default false.",
          ),
      },
    },
    async (input) => {
      return runTool(() =>
        runGetPackageStats({
          name: input.name,
          targetLicense: input.targetLicense,
          includeDependencyTree: input.includeDependencyTree,
        }),
      );
    },
  );

  server.registerTool(
    "list_known_projects",
    {
      title: "List projects the user has opened in VSCode",
      description:
        "Returns every workspace folder the user has opened in VSCode (with the npm-advisor extension installed), each annotated with its absolute path, parsed package.json `name`, last-opened timestamp, and whether it's currently open. CALL THIS FIRST when the user asks about 'my project', 'this project', 'my dependencies', or anything else that implies a workspace context — Claude Desktop has no concept of a current project, but VSCode does, and this tool surfaces that context. If exactly one project is currently open, you can confidently use its absolute path with the other tools. If multiple are open, ask the user which one. If `projects` is empty, use `registryFileExists` to tell the user the right thing: when it is `false`, the npm-advisor VSCode extension is not installed or has never run (recent-project tracking depends on that extension — recommend installing/activating it); when it is `true`, the extension is set up but no workspaces have been recorded yet (ask the user to open a project in VSCode, or to give you an explicit path).",
      inputSchema: {},
    },
    async () => {
      return runTool(async () => runListKnownProjects());
    },
  );

  server.registerTool(
    "list_workspace_dependencies",
    {
      title: "List package.json files in a workspace",
      description:
        "Walks a directory looking for every package.json (skipping node_modules, dist, build, .git, etc.) and returns each file's name + dependency counts. Lightweight — no network calls. Use this to map a project's layout before drilling into specific packages. When `workspacePath` is omitted, the tool auto-ascends from the server's current working directory to the surrounding monorepo workspace root (via pnpm-workspace.yaml or `package.json#workspaces`), so a single call returns every package the monorepo declares — not just the sub-package the server happened to be launched from. If the result contains a non-null `workspaceRoot`, the scanned path is a sub-package and the AI should re-call with `workspacePath` set to that value to widen the scan. If the user hasn't given any path context, call list_known_projects first to find out which projects they've opened in VSCode.",
      inputSchema: {
        workspacePath: z
          .string()
          .optional()
          .describe(
            "Absolute path to a project or monorepo root directory (example: /Users/you/projects/my-app). Leave empty to auto-detect from the server's current working directory — the tool will ascend to the surrounding pnpm/yarn/npm workspace root.",
          ),
      },
    },
    async (input) => {
      return runTool(() =>
        runListWorkspaceDependencies({
          workspacePath: input.workspacePath,
        }),
      );
    },
  );

  server.registerTool(
    "analyze_package_json",
    {
      title: "Analyze every dependency in a package.json",
      description:
        "Reads a package.json and fetches stats for every dep, devDep, and peerDep (concurrent + rate-aware). Returns per-package stats plus a roll-up summary (counts of vulnerable, license-incompatible, and replaceable packages). Use this when the user asks about the project as a whole — e.g. 'audit my dependencies' or 'which packages should I worry about'. If the user hasn't given an explicit path, call list_known_projects first to discover which projects they have open in VSCode. When presenting results, render a rich visual artifact (HTML or React) with: metric cards for the summary counts (total deps, vulnerable, license issues, replaceable), a bar chart of package scores color-coded by health (green ≥ 70, amber 40–69, red < 40), and tabbed sections for vulnerabilities, license issues, and replacement recommendations.",
      inputSchema: {
        packageJsonPath: z
          .string()
          .min(1)
          .describe(
            "Absolute path to a package.json file (example: /Users/you/projects/my-app/package.json). Call list_workspace_dependencies first to discover candidate paths.",
          ),
        targetLicense: z
          .string()
          .optional()
          .describe(
            "SPDX license id of the consuming project (defaults to MIT). Each dep's license-compatibility verdict is computed against this.",
          ),
      },
    },
    async (input) => {
      return runTool(() =>
        runAnalyzePackageJson({
          packageJsonPath: input.packageJsonPath,
          targetLicense: input.targetLicense,
        }),
      );
    },
  );

  server.registerTool(
    "analyze_project",
    {
      title: "Run project-level publint + replacement scan (e18e-style)",
      description:
        "Runs publint against the project at rootPath and scans its top-level dependencies against the e18e preferred-replacements manifest. Returns a unified ProjectAnalysis with one findings array (each entry tagged with source: 'publint' | 'replacements', a severity, a code, a message, the file it refers to, and rule-specific data) and a summary of counts. Read-only — never modifies files. Use this when the user asks about publishing hygiene ('is my package.json correctly configured to publish?', 'will my exports/types/files work?') or about cross-cutting dependency replacements at the project level ('which of my deps have lighter alternatives?'). For per-package fitness scores use get_package_stats; for a full per-dep audit with security/licenses use analyze_package_json. If the user hasn't given an explicit path, call list_known_projects first. When presenting results, group findings by source (publint findings as a publishing-readiness checklist, replacement findings as a recommendations list with the suggested alternatives and the e18e link).",
      inputSchema: {
        rootPath: z
          .string()
          .min(1)
          .describe(
            "Absolute or cwd-relative path to the project root (the directory containing package.json). Use list_workspace_dependencies first to discover candidates.",
          ),
        publintMode: z
          .enum(["source", "pack"])
          .optional()
          .describe(
            "'source' (default) lints the source directory directly — fast, suitable for repeated runs. 'pack' runs the project's package manager to produce a tarball first and lints that — slower but matches what publint.dev / e18e-cli report. Use 'pack' only when the user explicitly wants a pre-publish check.",
          ),
        skipPublint: z
          .boolean()
          .optional()
          .describe(
            "If true, skip the publint pass and only return replacement-opportunity findings. Default false.",
          ),
        skipReplacements: z
          .boolean()
          .optional()
          .describe(
            "If true, skip the replacement-opportunities pass and only return publint findings. Default false.",
          ),
      },
    },
    async (input) => {
      return runTool(() =>
        runAnalyzeProject({
          rootPath: input.rootPath,
          publintMode: input.publintMode,
          skipPublint: input.skipPublint,
          skipReplacements: input.skipReplacements,
        }),
      );
    },
  );

  return server;
}

/**
 * Entry point. By default speaks MCP over stdio (the canonical
 * mode that Claude Desktop, Claude Code, Cursor, Continue, and
 * VSCode 1.96+ all spawn the process for). Pass `--http` (with
 * optional `--port` / `--host`) to instead boot a Streamable HTTP
 * server — useful for hosting npm-advisor on a remote machine or
 * sharing a single instance between several local AI clients.
 *
 * When the HTTP transport is bound to a non-loopback host, set the
 * `MCP_HTTP_TOKEN` env var so requests must present
 * `Authorization: Bearer <token>`.
 */
async function main(): Promise<void> {
  const args = parseCliArgs(process.argv.slice(2));

  if (args.transport === "http") {
    await startHttpServer({
      port: args.port,
      host: args.host,
      authToken: process.env.MCP_HTTP_TOKEN,
      createMcpServer: createServer,
    });
    return;
  }

  const server = await createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

void main().catch((error) => {
  // stderr keeps the stdout channel clean for the JSON-RPC stream
  // — clients abort the handshake if any non-protocol bytes leak.
  process.stderr.write(
    `npm-advisor-mcp fatal: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}\n`,
  );
  process.exit(1);
});
