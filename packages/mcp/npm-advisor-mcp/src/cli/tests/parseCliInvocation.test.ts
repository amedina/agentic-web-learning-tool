/**
 * External dependencies.
 */
import { describe, expect, it } from "vitest";

/**
 * Internal dependencies.
 */
import { parseCliInvocation } from "../parseCliInvocation";

describe("parseCliInvocation", () => {
  it("returns help for the help command", () => {
    expect(parseCliInvocation(["help"])).toEqual({ command: "help" });
    expect(parseCliInvocation(["--help"])).toEqual({ command: "help" });
    expect(parseCliInvocation(["-h"])).toEqual({ command: "help" });
  });

  it("parses a bare list command", () => {
    expect(parseCliInvocation(["list"])).toEqual({
      command: "list",
      url: undefined,
      token: undefined,
    });
  });

  it("attaches --url and --token to list", () => {
    expect(
      parseCliInvocation([
        "--url",
        "http://example/mcp",
        "--token",
        "secret",
        "list",
      ]),
    ).toEqual({
      command: "list",
      url: "http://example/mcp",
      token: "secret",
    });
  });

  it("accepts the --name=value form for global flags", () => {
    expect(
      parseCliInvocation([
        "--url=http://example/mcp",
        "--token=secret",
        "list",
      ]),
    ).toEqual({
      command: "list",
      url: "http://example/mcp",
      token: "secret",
    });
  });

  it("parses a call command with JSON arguments", () => {
    expect(
      parseCliInvocation(["call", "get_package_stats", '{"name":"lodash"}']),
    ).toEqual({
      command: "call",
      toolName: "get_package_stats",
      toolArgs: { name: "lodash" },
      url: undefined,
      token: undefined,
    });
  });

  it("parses a call command with no arguments", () => {
    expect(parseCliInvocation(["call", "list_known_projects"])).toEqual({
      command: "call",
      toolName: "list_known_projects",
      toolArgs: undefined,
      url: undefined,
      token: undefined,
    });
  });

  it("rejects malformed JSON tool arguments", () => {
    expect(() =>
      parseCliInvocation(["call", "get_package_stats", "{name:lodash}"]),
    ).toThrow(/valid JSON/);
  });

  it("rejects non-object JSON tool arguments", () => {
    expect(() =>
      parseCliInvocation(["call", "get_package_stats", '["lodash"]']),
    ).toThrow(/JSON object/);
  });

  it("rejects an unknown command", () => {
    expect(() => parseCliInvocation(["wat"])).toThrow(/Unknown command/);
  });

  it("requires a command", () => {
    expect(() => parseCliInvocation([])).toThrow(/Missing command/);
  });

  it("requires a tool name for call", () => {
    expect(() => parseCliInvocation(["call"])).toThrow(/tool name/);
    expect(() => parseCliInvocation(["call", "--url"])).toThrow(/tool name/);
  });

  it("rejects extra arguments after list", () => {
    expect(() => parseCliInvocation(["list", "extra"])).toThrow(
      /Unexpected argument/,
    );
  });

  it("rejects a flag without a value", () => {
    expect(() => parseCliInvocation(["--url"])).toThrow(/requires a value/);
  });
});
