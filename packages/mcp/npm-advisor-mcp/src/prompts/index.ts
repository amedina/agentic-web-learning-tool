/**
 * External dependencies.
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Internal dependencies.
 */
import { registerAuditProjectPrompt } from "./auditProject";
import { registerComparePackagesPrompt } from "./comparePackages";
import { registerFixCircularDependenciesPrompt } from "./fixCircularDependencies";
import { registerFixPublishingIssuesPrompt } from "./fixPublishingIssues";

export { registerAuditProjectPrompt } from "./auditProject";
export { registerComparePackagesPrompt } from "./comparePackages";
export { registerFixCircularDependenciesPrompt } from "./fixCircularDependencies";
export { registerFixPublishingIssuesPrompt } from "./fixPublishingIssues";

/**
 * Register every prompt template the npm-advisor MCP server exposes.
 * Called by the server factory once per session. Prompts are
 * inspected by clients (often shown as `/audit-this-project` style
 * commands) and only execute when the user accepts.
 */
export function registerPrompts(server: McpServer): void {
  registerAuditProjectPrompt(server);
  registerComparePackagesPrompt(server);
  registerFixPublishingIssuesPrompt(server);
  registerFixCircularDependenciesPrompt(server);
}
