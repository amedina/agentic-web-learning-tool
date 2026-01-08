import { translatorApiExecutor } from "./translatorApiExecutor";
import type { RuntimeInterface } from "../runtime";
import type { ExecutionContext } from "../types";

describe("translatorApiExecutor", () => {
  let mockRuntime: jest.Mocked<RuntimeInterface>;
  let mockContext: ExecutionContext;

  beforeEach(() => {
    mockRuntime = {} as any;
    mockContext = { signal: new AbortController().signal } as any;

    (global as any).Translator = {
      create: jest.fn(),
    };
  });

  afterEach(() => {
    delete (global as any).Translator;
  });

  it("should throw error if input is missing", async () => {
    const config = { input: "", targetLanguage: "fr" };
    await expect(
      translatorApiExecutor(config, mockRuntime, mockContext)
    ).rejects.toThrow("requires input text");
  });

  it("should throw error if targetLanguage is missing", async () => {
    const config = { input: "Hello" };
    await expect(
      translatorApiExecutor(config, mockRuntime, mockContext)
    ).rejects.toThrow("requires a target language");
  });

  it("should create a translator and translate text", async () => {
    const config = {
      input: "Hello",
      targetLanguage: "fr",
      sourceLanguage: "en",
    };
    const mockTranslator = {
      translate: jest.fn().mockResolvedValue("Bonjour"),
    };
    (global as any).Translator.create.mockResolvedValue(mockTranslator);

    const result = await translatorApiExecutor(
      config,
      mockRuntime,
      mockContext
    );

    expect((global as any).Translator.create).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceLanguage: "en",
        targetLanguage: "fr",
        signal: mockContext.signal,
      })
    );
    expect(mockTranslator.translate).toHaveBeenCalledWith("Hello");
    expect(result).toBe("Bonjour");
  });

  it("should use 'en' as default sourceLanguage if not provided", async () => {
    const config = { input: "Hello", targetLanguage: "es" };
    const mockTranslator = { translate: jest.fn().mockResolvedValue("Hola") };
    (global as any).Translator.create.mockResolvedValue(mockTranslator);

    await translatorApiExecutor(config, mockRuntime, mockContext);

    expect((global as any).Translator.create).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceLanguage: "en",
      })
    );
  });

  it("should handle translator API failure", async () => {
    const config = { input: "Hello", targetLanguage: "fr" };
    (global as any).Translator.create.mockRejectedValue(new Error("API Fail"));

    await expect(
      translatorApiExecutor(config, mockRuntime, mockContext)
    ).rejects.toThrow("Translator API execution failed: API Fail");
  });
});
