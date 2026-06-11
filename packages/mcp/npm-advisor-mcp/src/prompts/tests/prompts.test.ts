/**
 * External dependencies.
 */
import { describe, expect, it } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Internal dependencies.
 */
import { registerPrompts } from "../index";

interface RegisteredPromptEntry {
  callback: (args: Record<string, string>) =>
    | Promise<{
        messages: Array<{
          role: string;
          content: { type: string; text: string };
        }>;
      }>
    | {
        messages: Array<{
          role: string;
          content: { type: string; text: string };
        }>;
      };
}

/**
 * Build a fresh server and inspect its private prompt registry so
 * each test can invoke a prompt's callback synchronously.
 */
function registeredPrompts(
  server: McpServer,
): Record<string, RegisteredPromptEntry> {
  return (
    server as unknown as {
      _registeredPrompts: Record<string, RegisteredPromptEntry>;
    }
  )._registeredPrompts;
}

describe("registerPrompts", () => {
  it("registers every prompt the server exposes", () => {
    const server = new McpServer({
      name: "npm-advisor-test",
      version: "0.0.0",
    });
    registerPrompts(server);
    const names = Object.keys(registeredPrompts(server));
    expect(names).toContain("audit-this-project");
    expect(names).toContain("compare-packages");
    expect(names).toContain("fix-publishing-issues");
    expect(names).toContain("fix-circular-dependencies");
  });

  it("audit-this-project interpolates packageJsonPath and target license", async () => {
    const server = new McpServer({
      name: "npm-advisor-test",
      version: "0.0.0",
    });
    registerPrompts(server);
    const prompt = registeredPrompts(server)["audit-this-project"];
    const result = await prompt.callback({
      packageJsonPath: "/tmp/demo/package.json",
      targetLicense: "Apache-2.0",
    });
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].role).toBe("user");
    expect(result.messages[0].content.type).toBe("text");
    const text = result.messages[0].content.text;
    expect(text).toContain("/tmp/demo/package.json");
    expect(text).toContain("Apache-2.0");
    expect(text).toContain("analyze_package_json");
    expect(text).toContain("versionResolution");
  });

  it("audit-this-project defaults to MIT when targetLicense is omitted", async () => {
    const server = new McpServer({
      name: "npm-advisor-test",
      version: "0.0.0",
    });
    registerPrompts(server);
    const prompt = registeredPrompts(server)["audit-this-project"];
    const result = await prompt.callback({
      packageJsonPath: "/tmp/demo/package.json",
    });
    expect(result.messages[0].content.text).toContain("MIT");
  });

  it("compare-packages includes both package names and required tool", async () => {
    const server = new McpServer({
      name: "npm-advisor-test",
      version: "0.0.0",
    });
    registerPrompts(server);
    const prompt = registeredPrompts(server)["compare-packages"];
    const result = await prompt.callback({
      packageA: "lodash",
      packageB: "es-toolkit",
    });
    const text = result.messages[0].content.text;
    expect(text).toContain("lodash");
    expect(text).toContain("es-toolkit");
    expect(text).toContain("get_package_stats");
    expect(text).toContain("MIT");
  });

  it("fix-publishing-issues interpolates rootPath, references the playbook, and defaults publintMode", async () => {
    const server = new McpServer({
      name: "npm-advisor-test",
      version: "0.0.0",
    });
    registerPrompts(server);
    const prompt = registeredPrompts(server)["fix-publishing-issues"];
    const result = await prompt.callback({ rootPath: "/tmp/demo" });
    const text = result.messages[0].content.text;
    expect(text).toContain("/tmp/demo");
    expect(text).toContain("analyze_project");
    expect(text).toContain("npm-advisor://publishing-hygiene-playbook");
    expect(text).toContain("node_modules");
    expect(text).toContain('"publintMode": "source"');
  });

  it("fix-publishing-issues honours an explicit publintMode", async () => {
    const server = new McpServer({
      name: "npm-advisor-test",
      version: "0.0.0",
    });
    registerPrompts(server);
    const prompt = registeredPrompts(server)["fix-publishing-issues"];
    const result = await prompt.callback({
      rootPath: "/tmp/demo",
      publintMode: "pack",
    });
    expect(result.messages[0].content.text).toContain('"publintMode": "pack"');
  });

  it("fix-circular-dependencies interpolates rootPath and targets circular findings", async () => {
    const server = new McpServer({
      name: "npm-advisor-test",
      version: "0.0.0",
    });
    registerPrompts(server);
    const prompt = registeredPrompts(server)["fix-circular-dependencies"];
    const result = await prompt.callback({ rootPath: "/tmp/demo" });
    const text = result.messages[0].content.text;
    expect(text).toContain("/tmp/demo");
    expect(text).toContain("analyze_project");
    expect(text).toContain("circular-deps");
    expect(text).toContain("import type");
  });
});
