import { writerApiExecutor } from "./writerApiExecutor";
import type { RuntimeInterface } from "../runtime";
import type { ExecutionContext } from "../types";

describe("writerApiExecutor", () => {
  let mockRuntime: jest.Mocked<RuntimeInterface>;
  let mockContext: ExecutionContext;

  beforeEach(() => {
    mockRuntime = {} as any;
    mockContext = { signal: new AbortController().signal } as any;

    (global as any).Writer = {
      create: jest.fn(),
    };
  });

  afterEach(() => {
    delete (global as any).Writer;
  });

  it("should write content with all options", async () => {
    const config = {
      input: "Write a story",
      sharedContext: "Once upon a time",
      tone: "formal",
      length: "long",
      format: "markdown",
      expectedInputLanguages: ["en"],
      outputLanguage: "en",
    };

    const mockWriter = { write: jest.fn().mockResolvedValue("Results") };
    (global as any).Writer.create.mockResolvedValue(mockWriter);

    const result = await writerApiExecutor(config, mockRuntime, mockContext);

    expect(result).toBe("Results");
    expect((global as any).Writer.create).toHaveBeenCalledWith(
      expect.objectContaining({
        sharedContext: "Once upon a time",
        tone: "formal",
        length: "long",
        format: "markdown",
        expectedInputLanguages: ["en"],
        outputLanguage: "en",
        signal: mockContext.signal,
      })
    );
  });

  it("should throw error if input is missing", async () => {
    await expect(
      writerApiExecutor({ input: "" }, mockRuntime, mockContext)
    ).rejects.toThrow("requires input/prompt text");
  });

  it("should handle API failure", async () => {
    (global as any).Writer.create.mockRejectedValue(new Error("Fail"));
    await expect(
      writerApiExecutor({ input: "text" }, mockRuntime, mockContext)
    ).rejects.toThrow("Writer API execution failed");
  });
});
