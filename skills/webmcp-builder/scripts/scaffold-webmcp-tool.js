/**
 * WebMCP Tool scaffold script
 * Run this script or copy this boilerplate to quickly generate a WebMCP tool definition
 */

/**
 * Creates a standard WebMCP tool definition object.
 * @param {Object} options - Tool configuration
 * @param {string} options.name - The action-oriented name of the tool (e.g., 'search_flights')
 * @param {string} options.description - The natural language description for the AI agent
 * @param {Object} options.inputSchemaProperties - The JSON schema properties object for parameters
 * @param {string[]} options.required - Array of required parameter names
 * @param {Function} options.executeFn - The async function that handles execution
 * @param {Object} [options.outputSchema] - Optional JSON Schema describing the return value structure
 * @returns {Object} WebMCP tool definition
 */
export function createWebMCPTool({
  name,
  description,
  inputSchemaProperties = {},
  required = [],
  executeFn,
  outputSchema,
}) {
  const tool = {
    name,
    description,
    inputSchema: {
      type: "object",
      properties: inputSchemaProperties,
      required: required,
    },
    annotations: {
      readOnlyHint: "false", // Change to "true" if the tool just reads data without side effects
      destructiveHint: "false", // Change to "true" if it deletes/irreversibly modifies stuff
      idempotentHint: "false", // Change to "true" if calling multiple times has same effect
      openWorldHint: "false", // Change to "true" if the tool interacts with external systems
    },
    execute: async (params, agent) => {
      try {
        return await executeFn(params, agent);
      } catch (error) {
        return `Error in tool '${name}': ${error.message}`;
      }
    },
  };

  if (outputSchema) {
    tool.outputSchema = outputSchema;
  }

  return tool;
}

// Example Usage:
/*
import { createWebMCPTool } from './scaffold-webmcp-tool.js';

const searchTool = createWebMCPTool({
  name: "search_flights",
  description: "Search for flights with the given origin and destination parameters.",
  inputSchemaProperties: {
    origin: { type: "string", description: "3-letter IATA airport code for origin" },
    destination: { type: "string", description: "3-letter IATA airport code for destination" }
  },
  required: ["origin", "destination"],
  outputSchema: {
    type: "object",
    properties: {
      results: {
        type: "array",
        items: {
          type: "object",
          properties: {
            flight: { type: "string" },
            price: { type: "number" }
          }
        }
      }
    }
  },
  executeFn: async ({ origin, destination }) => {
     const results = await flightSearch(origin, destination);
     return JSON.stringify({ results });
  }
});

// Register with feature detection:
if ("modelContext" in navigator) {
  navigator.modelContext.registerTool(searchTool);
}
*/
