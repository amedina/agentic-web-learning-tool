import { summarizerApiExecutor } from "./summarizerApiExecutor";
import type { RuntimeInterface } from "../runtime";
import type { ExecutionContext } from "../types";

describe("summarizerApiExecutor", () => {
  let mockRuntime: jest.Mocked<RuntimeInterface>;
  let mockContext: ExecutionContext;

  beforeEach(() => {
    mockRuntime = {} as any;
    mockContext = { signal: new AbortController().signal } as any;

    (global as any).Summarizer = {
      create: jest.fn(),
    };
  });

  afterEach(() => {
    delete (global as any).Summarizer;
  });

  it("should generate a summary with all options", async () => {
    const config = {
      input: "Very long text",
      type: "key-points",
      length: "short",
      context: "Background info",
      format: "markdown",
      expectedInputLanguages: ["en"],
      outputLanguage: "fr",
    };

    const mockSummarizer = {
      summarize: jest.fn().mockResolvedValue("Summary"),
      destroy: jest.fn(),
    };
    (global as any).Summarizer.create.mockResolvedValue(mockSummarizer);

    const result = await summarizerApiExecutor(
      config,
      mockRuntime,
      mockContext
    );

    expect(result).toBe("Summary");
    expect((global as any).Summarizer.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "key-points",
        length: "short",
        sharedContext: "Background info",
        format: "markdown",
        expectedInputLanguages: ["en"],
        outputLanguage: "fr",
        signal: mockContext.signal,
      })
    );
    expect(mockSummarizer.destroy).toHaveBeenCalled();
  });

  it("should handle error during summarization", async () => {
    (global as any).Summarizer.create.mockRejectedValue(new Error("API Error"));
    await expect(
      summarizerApiExecutor({ input: "text" }, mockRuntime, mockContext)
    ).rejects.toThrow("Summarizer API execution failed");
  });

  it("should throw error if input is missing", async () => {
    await expect(
      summarizerApiExecutor({ input: "" }, mockRuntime, mockContext)
    ).rejects.toThrow("requires input text");
  });
});
