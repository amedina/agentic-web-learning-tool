/**
 * Internal dependencies
 */
import { promptApiExecutor } from "../promptApiExecutor";
import type { RuntimeInterface } from "../../runtime";
import type { ExecutionContext } from "../../types";

describe("promptApiExecutor", () => {
  let mockRuntime: jest.Mocked<RuntimeInterface>;
  let mockContext: ExecutionContext;

  beforeEach(() => {
    mockRuntime = {} as any;
    mockContext = { signal: new AbortController().signal } as any;

    (global as any).LanguageModel = {
      create: jest.fn(),
    };
  });

  afterEach(() => {
    delete (global as any).LanguageModel;
  });

  it("should generate a prompt response with all options", async () => {
    const config = {
      input: "Hello",
      context: "Be helpful",
      temperature: 0.7,
      topK: 5,
      expectedInputsLanguages: ["en"],
      expectedOutputsLanguages: ["en"],
      initialPrompts: [{ role: "user", content: "Pre-prompt" }],
    };

    const mockSession = {
      prompt: jest.fn().mockResolvedValue("Hi there!"),
      destroy: jest.fn(),
    };
    (global as any).LanguageModel.create.mockResolvedValue(mockSession);

    const result = await promptApiExecutor(config, mockRuntime, mockContext);

    expect(result).toBe("Hi there!");
    expect((global as any).LanguageModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        temperature: 0.7,
        topK: 5,
        initialPrompts: [
          { role: "system", content: "Be helpful" },
          { role: "user", content: "Pre-prompt" },
        ],
        expectedInputs: [{ type: "text", languages: ["en"] }],
        expectedOutputs: [{ type: "text", languages: ["en"] }],
      })
    );
  });

  it("should handle missing optional configs", async () => {
    const mockSession = { prompt: jest.fn().mockResolvedValue("Response") };
    (global as any).LanguageModel.create.mockResolvedValue(mockSession);

    const result = await promptApiExecutor(
      { input: "Hi" },
      mockRuntime,
      mockContext
    );
    expect(result).toBe("Response");
    expect((global as any).LanguageModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        initialPrompts: [],
      })
    );
  });

  it("should throw error if input is missing", async () => {
    await expect(
      promptApiExecutor({ input: "" }, mockRuntime, mockContext)
    ).rejects.toThrow("requires input text");
  });

  it("should handle API failure", async () => {
    (global as any).LanguageModel.create.mockRejectedValue(
      new Error("Generic Failure")
    );
    await expect(
      promptApiExecutor({ input: "fail" }, mockRuntime, mockContext)
    ).rejects.toThrow("Prompt API execution failed");
  });
});
