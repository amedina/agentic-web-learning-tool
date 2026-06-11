/**
 * External dependencies.
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Internal dependencies.
 */
import { registerDataSourcesResource } from "./dataSources";
import { registerPublishingHygienePlaybookResource } from "./publishingHygienePlaybook";
import { registerRecommendedReplacementsResource } from "./recommendedReplacements";
import { registerScoringMethodologyResource } from "./scoringMethodology";

export { DATA_SOURCES_URI, registerDataSourcesResource } from "./dataSources";
export {
  PUBLISHING_HYGIENE_PLAYBOOK_URI,
  registerPublishingHygienePlaybookResource,
} from "./publishingHygienePlaybook";
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
 * scoring methodology, data-source provenance, the bundled replacement
 * recommendations, and the publishing-hygiene fix playbook so a client
 * can read documentation without consuming a tool slot.
 */
export function registerResources(server: McpServer): void {
  registerScoringMethodologyResource(server);
  registerDataSourcesResource(server);
  registerRecommendedReplacementsResource(server);
  registerPublishingHygienePlaybookResource(server);
}
