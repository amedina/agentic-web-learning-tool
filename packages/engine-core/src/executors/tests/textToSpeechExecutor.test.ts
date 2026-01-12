/**
 * Internal dependencies
 */
import { textToSpeechExecutor } from "../textToSpeechExecutor";
import type { RuntimeInterface } from "../../runtime";
import type { ExecutionContext } from "../../types";

describe("textToSpeechExecutor", () => {
  let mockRuntime: jest.Mocked<RuntimeInterface>;
  const mockContext = {} as ExecutionContext;

  beforeEach(() => {
    mockRuntime = {
      speakText: jest.fn().mockResolvedValue(undefined),
    } as any;
  });

  it("should trigger TTS with formatted input", async () => {
    const config = { input: "Hello" };
    const result = await textToSpeechExecutor(config, mockRuntime, mockContext);

    expect(mockRuntime.speakText).toHaveBeenCalledWith("Hello");
    expect(result).toBe("Hello");
  });

  it("should throw error if input is missing", async () => {
    const config = {};
    await expect(
      textToSpeechExecutor(config as any, mockRuntime, mockContext)
    ).rejects.toThrow("requires input text");
  });
});
