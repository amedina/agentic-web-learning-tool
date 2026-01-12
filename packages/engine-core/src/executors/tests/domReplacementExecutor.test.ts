/**
 * Internal dependencies
 */
import { domReplacementExecutor } from "../domReplacementExecutor";
import type { RuntimeInterface } from "../../runtime";
import type { ExecutionContext } from "../../types";

describe("domReplacementExecutor", () => {
  let mockRuntime: jest.Mocked<RuntimeInterface>;
  let mockContext: ExecutionContext;

  beforeEach(() => {
    mockRuntime = {
      replaceDOM: jest.fn().mockResolvedValue(undefined),
    } as any;
    mockContext = {} as any;
  });

  it("should replace DOM content using selector and formatted input", async () => {
    const config = { input: "New Content", selector: ".target" };
    const result = await domReplacementExecutor(
      config,
      mockRuntime,
      mockContext
    );

    expect(mockRuntime.replaceDOM).toHaveBeenCalledWith(
      ".target",
      "New Content",
      false,
      undefined
    );
    expect(result).toBe("New Content");
  });

  it("should pass isMultiple and loop index to runtime", async () => {
    const config = { input: "Many", selector: "div", isMultiple: true };
    mockContext.loop = { index: 5, total: 10 };

    await domReplacementExecutor(config, mockRuntime, mockContext);

    expect(mockRuntime.replaceDOM).toHaveBeenCalledWith("div", "Many", true, 5);
  });

  it("should throw error if selector is missing", async () => {
    const config = { input: "Test" };
    await expect(
      domReplacementExecutor(config, mockRuntime, mockContext)
    ).rejects.toThrow("requires a CSS selector");
  });

  it("should throw error if input is missing", async () => {
    const config = { selector: ".test" };
    await expect(
      domReplacementExecutor(config, mockRuntime, mockContext)
    ).rejects.toThrow("requires input text");
  });
});
