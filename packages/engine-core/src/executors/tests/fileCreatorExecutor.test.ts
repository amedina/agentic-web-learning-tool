/**
 * Internal dependencies
 */
import { fileCreatorExecutor } from "../fileCreatorExecutor";
import type { RuntimeInterface } from "../../runtime";
import type { ExecutionContext } from "../../types";

describe("fileCreatorExecutor", () => {
  let mockRuntime: jest.Mocked<RuntimeInterface>;
  const mockContext = {} as ExecutionContext;

  beforeEach(() => {
    mockRuntime = {
      downloadFile: jest.fn().mockResolvedValue(undefined),
    } as any;
  });

  it("should trigger file download with default filename", async () => {
    const config = { input: "file content" };
    const result = await fileCreatorExecutor(config, mockRuntime, mockContext);

    expect(mockRuntime.downloadFile).toHaveBeenCalledWith(
      "output.txt",
      "file content"
    );
    expect(result).toBe("file content");
  });

  it("should trigger file download with custom filename", async () => {
    const config = { input: "data", filename: "data.json" };
    await fileCreatorExecutor(config, mockRuntime, mockContext);

    expect(mockRuntime.downloadFile).toHaveBeenCalledWith("data.json", "data");
  });

  it("should throw error if input is missing", async () => {
    const config = { filename: "test.txt" };
    await expect(
      fileCreatorExecutor(config, mockRuntime, mockContext)
    ).rejects.toThrow("requires input text");
  });
});
