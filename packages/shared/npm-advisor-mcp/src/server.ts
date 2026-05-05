/**
 * Internal dependencies (must come first).
 */
// Side-effect import: rebinds console.* to stderr before anything else
// loads, so analyzer-core's `console.log({...})` doesn't corrupt the
// MCP JSON-RPC stream on stdout. See redirectConsoleToStderr.ts.
import "./redirectConsoleToStderr.ts";

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
import { runAnalyzePackageJson } from "./tools/analyzePackageJson.ts";
import { runGetPackageStats } from "./tools/getPackageStats.ts";
import { runListKnownProjects } from "./tools/listKnownProjects.ts";
import { runListWorkspaceDependencies } from "./tools/listWorkspaceDependencies.ts";

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
        "Fetches comprehensive stats for a single npm package: Fitness score, security advisories, license + compatibility verdict against the project's target license, bundle size, GitHub stars + last commit, and replacement recommendations from e18e. Use this when the user asks about a specific package by name.",
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
      const result = await runGetPackageStats({
        name: input.name,
        targetLicense: input.targetLicense,
        includeDependencyTree: input.includeDependencyTree,
      });
      return jsonResult(result);
    },
  );

  server.registerTool(
    "list_known_projects",
    {
      title: "List projects the user has opened in VSCode",
      description:
        "Returns every workspace folder the user has opened in VSCode (with the npm-advisor extension installed), each annotated with its absolute path, parsed package.json `name`, last-opened timestamp, and whether it's currently open. CALL THIS FIRST when the user asks about 'my project', 'this project', 'my dependencies', or anything else that implies a workspace context — Claude Desktop has no concept of a current project, but VSCode does, and this tool surfaces that context. If exactly one project is currently open, you can confidently use its absolute path with the other tools. If multiple are open, ask the user which one. If the list is empty, the user either hasn't installed the npm-advisor VSCode extension or hasn't opened any workspace in VSCode yet — tell them so.",
      inputSchema: {},
    },
    async () => {
      const result = runListKnownProjects();
      return jsonResult(result);
    },
  );

  server.registerTool(
    "list_workspace_dependencies",
    {
      title: "List package.json files in a workspace",
      description:
        "Walks a directory looking for every package.json (skipping node_modules, dist, build, .git, etc.) and returns each file's name + dependency counts. Lightweight — no network calls. Use this to map a project's layout before drilling into specific packages. If the user hasn't given an explicit path, call list_known_projects first to find out which projects they've opened in VSCode.",
      inputSchema: {
        workspacePath: z
          .string()
          .optional()
          .describe(
            "Directory to scan. Defaults to the server process's current working directory (which is typically the project root when launched by an MCP-aware editor).",
          ),
      },
    },
    async (input) => {
      const result = await runListWorkspaceDependencies({
        workspacePath: input.workspacePath,
      });
      return jsonResult(result);
    },
  );

  server.registerTool(
    "analyze_package_json",
    {
      title: "Analyze every dependency in a package.json",
      description:
        "Reads a package.json and fetches stats for every dep, devDep, and peerDep (concurrent + rate-aware). Returns per-package stats plus a roll-up summary (counts of vulnerable, license-incompatible, and replaceable packages). Use this when the user asks about the project as a whole — e.g. 'audit my dependencies' or 'which packages should I worry about'. If the user hasn't given an explicit path, call list_known_projects first to discover which projects they have open in VSCode.",
      inputSchema: {
        packageJsonPath: z
          .string()
          .min(1)
          .describe(
            "Absolute or cwd-relative path to the package.json file. Use list_workspace_dependencies first to discover candidates.",
          ),
        targetLicense: z
          .string()
          .optional()
          .describe(
            "SPDX license id of the consuming project (defaults to MIT). Each dep's license-compatibility verdict is computed against this.",
          ),
        concurrency: z
          .number()
          .int()
          .min(1)
          .max(10)
          .optional()
          .describe(
            "Maximum simultaneous package fetches (default 3). Higher values speed up large workspaces but risk hitting npm/GitHub secondary rate limits.",
          ),
      },
    },
    async (input) => {
      const result = await runAnalyzePackageJson({
        packageJsonPath: input.packageJsonPath,
        targetLicense: input.targetLicense,
        concurrency: input.concurrency,
      });
      return jsonResult(result);
    },
  );

  return server;
}

/**
 * Wraps a tool handler's output in the MCP CallToolResult shape.
 * Every tool in this server returns plain JSON so a client AI can
 * parse it deterministically; using `text` content with stringified
 * JSON is the canonical way to do that today.
 */
function jsonResult(value: unknown): {
  content: Array<{ type: "text"; text: string }>;
} {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(value, null, 2),
      },
    ],
  };
}

/**
 * stdio entry point. MCP clients (Claude Desktop, Claude Code,
 * Cursor, Continue, VSCode 1.96+) spawn this process and speak the
 * MCP JSON-RPC framing over stdin / stdout. The handshake itself is
 * driven by the SDK; we just connect a transport.
 */
async function main(): Promise<void> {
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
