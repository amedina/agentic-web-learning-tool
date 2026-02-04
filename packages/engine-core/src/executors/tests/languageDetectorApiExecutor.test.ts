/**
 * Internal dependencies
 */
import { languageDetectorApiExecutor } from "../languageDetectorApiExecutor";
import type { RuntimeInterface } from "../../runtime";
import type { ExecutionContext } from "../../types";

describe("languageDetectorApiExecutor", () => {
  let mockRuntime: jest.Mocked<RuntimeInterface>;
  let mockContext: ExecutionContext;

  beforeEach(() => {
    mockRuntime = {} as any;
    mockContext = { signal: new AbortController().signal } as any;

    (global as any).LanguageDetector = {
      create: jest.fn(),
    };
  });

  afterEach(() => {
    delete (global as any).LanguageDetector;
  });

  it("should throw error if input is missing", async () => {
    const config = { input: "" };
    await expect(
      languageDetectorApiExecutor(config, mockRuntime, mockContext)
    ).rejects.toThrow("requires input text");
  });

  it("should detect language of text", async () => {
    const config = { input: "Ceci est un test" };
    const mockDetector = {
      detect: jest.fn().mockResolvedValue([
        { detectedLanguage: "en", confidence: 0.1 },
        { detectedLanguage: "fr", confidence: 0.9 },
      ]),
    };
    (global as any).LanguageDetector.create.mockResolvedValue(mockDetector);

    const result = await languageDetectorApiExecutor(
      config,
      mockRuntime,
      mockContext
    );

    expect((global as any).LanguageDetector.create).toHaveBeenCalledWith(
      expect.objectContaining({
        signal: mockContext.signal,
      })
    );
    expect(mockDetector.detect).toHaveBeenCalledWith("Ceci est un test");
    expect(result).toBe("fr");
  });

  it("should return empty string if no language detected", async () => {
    const config = { input: "..." };
    const mockDetector = { detect: jest.fn().mockResolvedValue([]) };
    (global as any).LanguageDetector.create.mockResolvedValue(mockDetector);

    const result = await languageDetectorApiExecutor(
      config,
      mockRuntime,
      mockContext
    );
    expect(result).toBe("");
  });

  it("should handle error during detection", async () => {
    const config = { input: "Fail" };
    (global as any).LanguageDetector.create.mockRejectedValue(
      new Error("API Error")
    );

    await expect(
      languageDetectorApiExecutor(config, mockRuntime, mockContext)
    ).rejects.toThrow("Language Detector API execution failed: API Error");
  });
});
