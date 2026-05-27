/**
 * External dependencies.
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Internal dependencies.
 */
import { registerDataSourcesResource } from "./dataSources";
import { registerRecommendedReplacementsResource } from "./recommendedReplacements";
import { registerScoringMethodologyResource } from "./scoringMethodology";

export { DATA_SOURCES_URI, registerDataSourcesResource } from "./dataSources";
export {
  RECOMMENDED_REPLACEMENTS_URI,
  registerRecommendedReplacementsResource,
} from "./recommendedReplacements";
export {
  SCORING_METHODOLOGY_URI,
  registerScoringMethodologyResource,
} from "./scoringMethodology";

/**
 * Register every static resource the npm-advisor MCP server exposes.
 * Called by the server factory once per session. Resources advertise
 * scoring methodology, data-source provenance, and the bundled
 * replacement recommendations so a client can read documentation
 * without consuming a tool slot.
 */
export function registerResources(server: McpServer): void {
  registerScoringMethodologyResource(server);
  registerDataSourcesResource(server);
  registerRecommendedReplacementsResource(server);
}
