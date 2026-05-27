/**
 * External dependencies.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Internal dependencies.
 */
import {
  DATA_SOURCES_URI,
  RECOMMENDED_REPLACEMENTS_URI,
  SCORING_METHODOLOGY_URI,
  registerResources,
} from "../index";

/**
 * Build a fresh McpServer for each test. The constructor accepts a
 * trivial { name, version } pair; we never connect it to a transport
 * because reading resources goes through the in-memory registration
 * map.
 */
function makeServer(): McpServer {
  return new McpServer({ name: "npm-advisor-test", version: "0.0.0" });
}

/**
 * Pull the registered resource off the underlying server registry so
 * tests can invoke its read callback directly without going through a
 * full SDK request round-trip.
 */
function registeredResources(
  server: McpServer,
): Record<
  string,
  {
    metadata?: { title?: string };
    readCallback: (uri: URL) => Promise<unknown>;
  }
> {
  return (
    server as unknown as {
      _registeredResources: Record<
        string,
        {
          metadata?: { title?: string };
          readCallback: (uri: URL) => Promise<unknown>;
        }
      >;
    }
  )._registeredResources;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("registerResources", () => {
  it("registers all three static resources", () => {
    const server = makeServer();
    registerResources(server);
    const resources = registeredResources(server);
    const uris = Object.keys(resources);
    expect(uris).toContain(SCORING_METHODOLOGY_URI);
    expect(uris).toContain(DATA_SOURCES_URI);
    expect(uris).toContain(RECOMMENDED_REPLACEMENTS_URI);
  });

  it("scoring methodology serves markdown describing the score axes", async () => {
    const server = makeServer();
    registerResources(server);
    const resources = registeredResources(server);
    const result = (await resources[SCORING_METHODOLOGY_URI].readCallback(
      new URL(SCORING_METHODOLOGY_URI),
    )) as {
      contents: Array<{ uri: string; mimeType: string; text: string }>;
    };
    expect(result.contents).toHaveLength(1);
    expect(result.contents[0].mimeType).toBe("text/markdown");
    expect(result.contents[0].text).toContain("Bundle size");
    expect(result.contents[0].text).toContain("Dependencies");
    expect(result.contents[0].text).toContain("Responsiveness");
    expect(result.contents[0].text).toContain("Security penalty");
    expect(result.contents[0].text).toContain("versionResolution");
  });

  it("data sources lists every upstream API the analyzer touches", async () => {
    const server = makeServer();
    registerResources(server);
    const resources = registeredResources(server);
    const result = (await resources[DATA_SOURCES_URI].readCallback(
      new URL(DATA_SOURCES_URI),
    )) as {
      contents: Array<{ text: string; mimeType: string }>;
    };
    expect(result.contents[0].mimeType).toBe("text/markdown");
    const text = result.contents[0].text;
    expect(text).toContain("npm registry");
    expect(text).toContain("bundlephobia");
    expect(text).toContain("OSV");
    expect(text).toContain("GitHub Security Advisories");
    expect(text).toContain("e18e module-replacements");
  });

  it("recommended replacements returns the JSON-shaped summary", async () => {
    // Stub the fetchModuleReplacements helper so the test doesn't hit
    // the network. We do this by mocking at the global fetch layer
    // since analyzer-core's fetchWithCache eventually calls fetch().
    const responseBody = {
      mappings: { lodash: { replacements: ["es-toolkit"] } },
      replacements: { "es-toolkit": { id: "es-toolkit", name: "es-toolkit" } },
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => responseBody,
      }),
    );

    const server = makeServer();
    registerResources(server);
    const resources = registeredResources(server);
    const result = (await resources[RECOMMENDED_REPLACEMENTS_URI].readCallback(
      new URL(RECOMMENDED_REPLACEMENTS_URI),
    )) as {
      contents: Array<{ text: string; mimeType: string }>;
    };
    expect(result.contents[0].mimeType).toBe("application/json");
    const payload = JSON.parse(result.contents[0].text) as {
      replacements: Array<{ fromPackage: string }>;
    };
    expect(
      payload.replacements.some((entry) => entry.fromPackage === "lodash"),
    ).toBe(true);
  });
});
