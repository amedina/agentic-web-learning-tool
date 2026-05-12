/**
 * External dependencies.
 */
import { describe, expect, it } from "vitest";

/**
 * Internal dependencies.
 */
import {
  DEFAULT_HTTP_HOST,
  DEFAULT_HTTP_PORT,
  parseCliArgs,
} from "../parseCliArgs";

describe("parseCliArgs", () => {
  it("defaults to stdio when no flags are passed", () => {
    expect(parseCliArgs([])).toEqual({ transport: "stdio" });
  });

  it("recognises --http and applies default host/port", () => {
    expect(parseCliArgs(["--http"])).toEqual({
      transport: "http",
      port: DEFAULT_HTTP_PORT,
      host: DEFAULT_HTTP_HOST,
    });
  });

  it("recognises --transport=http long form", () => {
    expect(parseCliArgs(["--transport=http"])).toEqual({
      transport: "http",
      port: DEFAULT_HTTP_PORT,
      host: DEFAULT_HTTP_HOST,
    });
  });

  it("--transport stdio overrides a previous --http", () => {
    expect(parseCliArgs(["--http", "--transport", "stdio"])).toEqual({
      transport: "stdio",
    });
  });

  it("accepts --port=4000 and --host=0.0.0.0 in equals form", () => {
    expect(parseCliArgs(["--http", "--port=4000", "--host=0.0.0.0"])).toEqual({
      transport: "http",
      port: 4000,
      host: "0.0.0.0",
    });
  });

  it("accepts --port and --host in space-separated form", () => {
    expect(
      parseCliArgs(["--http", "--port", "5000", "--host", "192.168.1.10"]),
    ).toEqual({
      transport: "http",
      port: 5000,
      host: "192.168.1.10",
    });
  });

  it("rejects unknown --transport values", () => {
    expect(() => parseCliArgs(["--transport=websocket"])).toThrow(
      /Unknown --transport value/,
    );
  });

  it("rejects unknown arguments so typos surface immediately", () => {
    expect(() => parseCliArgs(["--htttp"])).toThrow(/Unknown argument/);
  });

  it("rejects ports outside the valid range", () => {
    expect(() => parseCliArgs(["--http", "--port=99999"])).toThrow(
      /Invalid --port value/,
    );
    expect(() => parseCliArgs(["--http", "--port=-1"])).toThrow(
      /Invalid --port value/,
    );
    expect(() => parseCliArgs(["--http", "--port=abc"])).toThrow(
      /Invalid --port value/,
    );
  });

  it("rejects an empty --host value", () => {
    expect(() => parseCliArgs(["--http", "--host="])).toThrow(
      /--host value cannot be empty/,
    );
  });

  it("requires a value for space-separated flags", () => {
    expect(() => parseCliArgs(["--port"])).toThrow(/--port requires a value/);
    expect(() => parseCliArgs(["--host"])).toThrow(/--host requires a value/);
  });
});
