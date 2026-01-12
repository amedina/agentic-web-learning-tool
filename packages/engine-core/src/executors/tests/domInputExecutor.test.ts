/**
 * Internal dependencies
 */
import { domInputExecutor } from "../domInputExecutor";
import type { RuntimeInterface } from "../../runtime";
import type { ExecutionContext } from "../../types";

describe("domInputExecutor", () => {
  let mockRuntime: jest.Mocked<RuntimeInterface>;
  const mockContext = {} as ExecutionContext;

  beforeEach(() => {
    mockRuntime = {
      queryPage: jest.fn(),
    } as any;
  });

  it("should query the page with given selector and extract type", async () => {
    const config = { cssSelector: ".my-class", extract: "innerText" };
    mockRuntime.queryPage.mockResolvedValue("extracted text");

    const result = await domInputExecutor(config, mockRuntime, mockContext);

    expect(mockRuntime.queryPage).toHaveBeenCalledWith(
      ".my-class",
      "innerText",
      false
    );
    expect(result).toBe("extracted text");
  });

  it("should throw error if selector is missing and no default value", async () => {
    const config = {};
    await expect(
      domInputExecutor(config, mockRuntime, mockContext)
    ).rejects.toThrow("requires a CSS selector");
  });

  it("should return default value if selector is missing", async () => {
    const config = { defaultValue: "fallback" };
    const result = await domInputExecutor(config, mockRuntime, mockContext);
    expect(result).toBe("fallback");
  });

  it("should return default value if query returns an empty string", async () => {
    const config = { cssSelector: ".none", defaultValue: "fallback" };
    mockRuntime.queryPage.mockResolvedValue("");

    const result = await domInputExecutor(config, mockRuntime, mockContext);
    expect(result).toBe("fallback");
  });

  it("should handle multiple results", async () => {
    const config = { cssSelector: "li", isMultiple: true };
    mockRuntime.queryPage.mockResolvedValue(["a", "b"]);

    const result = await domInputExecutor(config, mockRuntime, mockContext);
    expect(mockRuntime.queryPage).toHaveBeenCalledWith(
      "li",
      "textContent",
      true
    );
    expect(result).toEqual(["a", "b"]);
  });

  it("should return empty array for multiple results if none found (empty array)", async () => {
    const config = { cssSelector: "li", isMultiple: true };
    mockRuntime.queryPage.mockResolvedValue([]);

    const result = await domInputExecutor(config, mockRuntime, mockContext);
    expect(result).toEqual([]);
  });

  it("should handle runtime errors by falling back to default value", async () => {
    const config = { cssSelector: ".fail", defaultValue: "fallback" };
    mockRuntime.queryPage.mockRejectedValue(new Error("DOM Error"));

    const result = await domInputExecutor(config, mockRuntime, mockContext);
    expect(result).toBe("fallback");
  });
});
