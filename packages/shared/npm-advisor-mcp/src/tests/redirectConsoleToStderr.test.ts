/**
 * External dependencies.
 */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

describe("redirectConsoleToStderr", () => {
  let stdoutSpy: ReturnType<typeof vi.spyOn>;
  let stderrSpy: ReturnType<typeof vi.spyOn>;
  let originalConsole: Record<string, typeof console.log>;

  beforeEach(() => {
    originalConsole = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      debug: console.debug,
      error: console.error,
    };
    stdoutSpy = vi
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);
    stderrSpy = vi
      .spyOn(process.stderr, "write")
      .mockImplementation(() => true);
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
    console.log = originalConsole.log;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.debug = originalConsole.debug;
    console.error = originalConsole.error;
    // Drop the cached module so the next import re-runs the side-effect
    // patch — required because Node caches ESM modules per process.
    vi.resetModules();
  });

  it("rebinds every console method to write to stderr", async () => {
    await import("../redirectConsoleToStderr.ts");

    console.log("string log");
    console.info("string info");
    console.warn("string warn");
    console.debug("string debug");
    console.error("string error");

    expect(stdoutSpy).not.toHaveBeenCalled();
    const stderrCalls = stderrSpy.mock.calls.map((call) => String(call[0]));
    expect(stderrCalls).toEqual([
      "string log\n",
      "string info\n",
      "string warn\n",
      "string debug\n",
      "string error\n",
    ]);
  });

  it("stringifies object arguments via JSON so analyzer-core's payload dumps don't crash", async () => {
    await import("../redirectConsoleToStderr.ts");

    console.log({
      nativeReplacements: { AbortController: { type: "native" } },
    });

    expect(stdoutSpy).not.toHaveBeenCalled();
    expect(stderrSpy).toHaveBeenCalledTimes(1);
    expect(String(stderrSpy.mock.calls[0][0])).toBe(
      '{"nativeReplacements":{"AbortController":{"type":"native"}}}\n',
    );
  });

  it("joins multiple arguments with a space, matching console's default formatter", async () => {
    await import("../redirectConsoleToStderr.ts");

    console.log("[NPM Advisor]", "Fetching stats for", "lodash");

    expect(String(stderrSpy.mock.calls[0][0])).toBe(
      "[NPM Advisor] Fetching stats for lodash\n",
    );
  });
});
