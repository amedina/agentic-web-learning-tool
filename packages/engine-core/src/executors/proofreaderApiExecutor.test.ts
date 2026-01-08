import { proofreaderApiExecutor } from "./proofreaderApiExecutor";
import type { RuntimeInterface } from "../runtime";
import type { ExecutionContext } from "../types";

describe("proofreaderApiExecutor", () => {
  let mockRuntime: jest.Mocked<RuntimeInterface>;
  let mockContext: ExecutionContext;

  beforeEach(() => {
    mockRuntime = {} as any;
    mockContext = { signal: new AbortController().signal } as any;

    (global as any).Proofreader = {
      create: jest.fn(),
    };
  });

  afterEach(() => {
    delete (global as any).Proofreader;
  });

  it("should proofread content with all options", async () => {
    const config = {
      input: "some text",
      sharedContext: "ctx",
      expectedInputLanguages: ["en"],
      outputLanguage: "en",
    };

    const mockProofreader = {
      proofread: jest.fn().mockResolvedValue({
        corrections: [
          { startIndex: 5, endIndex: 9, suggestions: ["corrected"] },
        ],
      }),
    };
    (global as any).Proofreader.create.mockResolvedValue(mockProofreader);

    const result = await proofreaderApiExecutor(
      config,
      mockRuntime,
      mockContext
    );

    expect(result).toBe("some corrected"); // "some " + "corrected"
    expect((global as any).Proofreader.create).toHaveBeenCalledWith(
      expect.objectContaining({
        expectedInputLanguages: ["en"],
        signal: mockContext.signal,
      })
    );
  });

  it("should throw error if input is missing", async () => {
    await expect(
      proofreaderApiExecutor({ input: "" }, mockRuntime, mockContext)
    ).rejects.toThrow("requires input text");
  });

  it("should handle API failure", async () => {
    (global as any).Proofreader.create.mockRejectedValue(new Error("Fail"));
    await expect(
      proofreaderApiExecutor({ input: "text" }, mockRuntime, mockContext)
    ).rejects.toThrow("Proofreader API execution failed");
  });
});
