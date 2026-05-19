/**
 * External dependencies.
 */
import { describe, expect, it } from "vitest";
import { GithubRateLimitError } from "@agentic-web-labs/package-analyzer-core";

/**
 * Internal dependencies.
 */
import { runTool } from "../toolRunner";

describe("runTool", () => {
  it("serialises the handler's return value into a text content block", async () => {
    const result = await runTool(async () => ({ name: "lodash", score: 92 }));
    expect(result).toEqual({
      content: [
        {
          type: "text",
          text: JSON.stringify({ name: "lodash", score: 92 }, null, 2),
        },
      ],
    });
    expect(result.isError).toBeUndefined();
  });

  it("converts GithubRateLimitError into an actionable isError result", async () => {
    const result = await runTool(async () => {
      throw new GithubRateLimitError("https://api.github.com/repos/foo/bar");
    });
    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    const text = result.content[0].text;
    expect(text).toContain("GITHUB_TOKEN");
    expect(text).toContain("public read");
    expect(text).toContain("5,000 requests/hour");
    expect(text).toContain("https://api.github.com/repos/foo/bar");
  });

  it("rethrows non-rate-limit errors so the MCP SDK can surface them", async () => {
    await expect(
      runTool(async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
  });
});
