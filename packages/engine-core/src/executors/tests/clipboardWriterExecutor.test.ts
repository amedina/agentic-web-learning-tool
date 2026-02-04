/**
 * Internal dependencies
 */
import { clipboardWriterExecutor } from "../clipboardWriterExecutor";
import type { RuntimeInterface } from "../../runtime";
import type { ExecutionContext } from "../../types";

describe("clipboardWriterExecutor", () => {
  let mockRuntime: jest.Mocked<RuntimeInterface>;
  const mockContext = {} as ExecutionContext;

  beforeEach(() => {
    mockRuntime = {
      copyToClipboard: jest.fn().mockResolvedValue(undefined),
    } as any;
  });

  it("should copy formatted input to clipboard", async () => {
    const config = { input: "copy this" };
    const result = await clipboardWriterExecutor(
      config,
      mockRuntime,
      mockContext
    );
    expect(mockRuntime.copyToClipboard).toHaveBeenCalledWith("copy this");
    expect(result).toBe("copy this");
  });

  it("should throw error if input is missing", async () => {
    const config = { input: "" };
    await expect(
      clipboardWriterExecutor(config, mockRuntime, mockContext)
    ).rejects.toThrow("requires input text");
  });

  it("should handle array input by joining with newlines", async () => {
    const config = { input: ["line1", "line2"] };
    const result = await clipboardWriterExecutor(
      config,
      mockRuntime,
      mockContext
    );
    expect(mockRuntime.copyToClipboard).toHaveBeenCalledWith("line1\nline2");
    expect(result).toBe("line1\nline2");
  });
});
