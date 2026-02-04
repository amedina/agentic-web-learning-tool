/**
 * Internal dependencies
 */
import { ServiceWorkerRuntime } from "../runtime";

describe("ServiceWorkerRuntime", () => {
  let runtime: ServiceWorkerRuntime;

  beforeEach(() => {
    // Mock chrome API
    (global as any).chrome = {
      storage: {
        local: {
          get: jest.fn(),
          set: jest.fn(),
        },
      },
      tabs: {
        query: jest.fn(),
        sendMessage: jest.fn(),
      },
      runtime: {
        lastError: null,
      },
    };

    // Mock global AI APIs
    (global as any).self = global as any;
    (global as any).LanguageModel = { availability: jest.fn() };
    (global as any).Writer = { availability: jest.fn() };
    (global as any).Rewriter = { availability: jest.fn() };
    (global as any).Summarizer = { availability: jest.fn() };
    (global as any).Translator = { availability: jest.fn() };
    (global as any).LanguageDetector = { availability: jest.fn() };
    (global as any).Proofreader = { availability: jest.fn() };

    runtime = new ServiceWorkerRuntime();
  });

  afterEach(() => {
    delete (global as any).chrome;
    delete (global as any).LanguageModel;
    delete (global as any).Writer;
    delete (global as any).Rewriter;
    delete (global as any).Summarizer;
    delete (global as any).Translator;
    delete (global as any).LanguageDetector;
    delete (global as any).Proofreader;
  });

  describe("Capability Checks", () => {
    it("should return true for tools", async () => {
      expect(await runtime.checkCapability("staticInput")).toBe(true);
      expect(await runtime.checkCapability("domInput")).toBe(true);
      expect(await runtime.checkCapability("alertNotification")).toBe(true);
      expect(await runtime.checkCapability("condition")).toBe(true);
    });

    it("should return false for unknown capability", async () => {
      expect(await runtime.checkCapability("unknown")).toBe(false);
    });

    it("should check AI API availability correctly (promptApi)", async () => {
      (global as any).LanguageModel.availability.mockResolvedValue("available");
      expect(await runtime.checkCapability("promptApi")).toBe(true);

      (global as any).LanguageModel.availability.mockResolvedValue(
        "unavailable"
      );
      expect(await runtime.checkCapability("promptApi")).toBe(false);
    });

    it("should return false if AI API is missing in self", async () => {
      delete (global as any).LanguageModel;
      expect(await runtime.checkCapability("promptApi")).toBe(false);
    });

    it("should check all other AI APIs", async () => {
      (global as any).Writer.availability.mockResolvedValue("available");
      expect(await runtime.checkCapability("writerApi")).toBe(true);

      (global as any).Rewriter.availability.mockResolvedValue("available");
      expect(await runtime.checkCapability("rewriterApi")).toBe(true);

      (global as any).Summarizer.availability.mockResolvedValue("available");
      expect(await runtime.checkCapability("summarizerApi")).toBe(true);

      (global as any).Translator.availability.mockResolvedValue("available");
      expect(await runtime.checkCapability("translatorApi")).toBe(true);

      (global as any).LanguageDetector.availability.mockResolvedValue(
        "available"
      );
      expect(await runtime.checkCapability("languageDetectorApi")).toBe(true);

      (global as any).Proofreader.availability.mockResolvedValue("available");
      expect(await runtime.checkCapability("proofreaderApi")).toBe(true);
    });
  });

  describe("Storage", () => {
    it("should get value from storage", async () => {
      (chrome.storage.local.get as jest.Mock).mockImplementation((key, cb) => {
        cb({ [key]: "val" });
      });
      const val = await runtime.getStorage("testKey");
      expect(val).toBe("val");
      expect(chrome.storage.local.get).toHaveBeenCalledWith(
        "testKey",
        expect.any(Function)
      );
    });

    it("should set value in storage", async () => {
      (chrome.storage.local.set as jest.Mock).mockImplementation((obj, cb) => {
        cb();
      });
      await runtime.setStorage("testKey", "testVal");
      expect(chrome.storage.local.set).toHaveBeenCalledWith(
        { testKey: "testVal" },
        expect.any(Function)
      );
    });
  });

  describe("Tab Management", () => {
    it("should use explicitly set target tab", async () => {
      runtime.setTargetTab(123);
      (chrome.tabs.sendMessage as jest.Mock).mockResolvedValue({
        success: true,
      });
      await runtime.showAlert("hi");
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
        123,
        expect.any(Object)
      );
    });

    it("should find active tab if no target tab is set", async () => {
      (chrome.tabs.query as jest.Mock).mockResolvedValue([{ id: 456 }]);
      (chrome.tabs.sendMessage as jest.Mock).mockResolvedValue({
        success: true,
      });
      await runtime.showAlert("hi");
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
        456,
        expect.any(Object)
      );
    });

    it("should throw error if no active tab is found", async () => {
      (chrome.tabs.query as jest.Mock).mockResolvedValue([]);
      await expect(runtime.showAlert("hi")).rejects.toThrow(
        "No active tab found"
      );
    });
  });

  describe("Content Script Communication", () => {
    beforeEach(() => {
      runtime.setTargetTab(1);
    });

    it("should handle successful DOM query", async () => {
      (chrome.tabs.sendMessage as jest.Mock).mockResolvedValue({
        success: true,
        data: "extracted",
      });
      const result = await runtime.queryPage("div", "textContent");
      expect(result).toBe("extracted");
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(1, {
        type: "QUERY_DOM",
        selector: "div",
        extract: "textContent",
        isMultiple: undefined,
      });
    });

    it("should handle failed DOM query (error in response)", async () => {
      (chrome.tabs.sendMessage as jest.Mock).mockResolvedValue({
        success: false,
        error: "not found",
      });
      await expect(runtime.queryPage("div", "textContent")).rejects.toThrow(
        "not found"
      );

      (chrome.tabs.sendMessage as jest.Mock).mockResolvedValue({
        success: false,
      });
      await expect(runtime.queryPage("div", "textContent")).rejects.toThrow(
        "DOM query failed"
      );
    });

    it("should handle failed DOM query (chrome runtime error)", async () => {
      (chrome.runtime as any).lastError = { message: "msg failed" };
      (chrome.tabs.sendMessage as jest.Mock).mockResolvedValue({
        success: true,
      });
      await expect(runtime.queryPage("div", "textContent")).rejects.toThrow(
        "msg failed"
      );
    });

    it("should handle failed showAlert", async () => {
      (chrome.tabs.sendMessage as jest.Mock).mockResolvedValue({
        success: false,
        error: "alert failed",
      });
      await expect(runtime.showAlert("hi")).rejects.toThrow("alert failed");

      (chrome.runtime as any).lastError = { message: "comm error" };
      await expect(runtime.showAlert("hi")).rejects.toThrow("comm error");
    });

    it("should handle failed replaceDOM", async () => {
      (chrome.tabs.sendMessage as jest.Mock).mockResolvedValue({
        success: false,
        error: "replace failed",
      });
      await expect(runtime.replaceDOM("div", "c")).rejects.toThrow(
        "replace failed"
      );

      (chrome.runtime as any).lastError = { message: "comm error" };
      await expect(runtime.replaceDOM("div", "c")).rejects.toThrow(
        "comm error"
      );
    });

    it("should handle failed copyToClipboard", async () => {
      (chrome.tabs.sendMessage as jest.Mock).mockResolvedValue({
        success: false,
        error: "copy failed",
      });
      await expect(runtime.copyToClipboard("t")).rejects.toThrow("copy failed");

      (chrome.runtime as any).lastError = { message: "comm error" };
      await expect(runtime.copyToClipboard("t")).rejects.toThrow("comm error");
    });

    it("should handle failed downloadFile", async () => {
      (chrome.tabs.sendMessage as jest.Mock).mockResolvedValue({
        success: false,
        error: "download failed",
      });
      await expect(runtime.downloadFile("f", "c")).rejects.toThrow(
        "download failed"
      );

      (chrome.runtime as any).lastError = { message: "comm error" };
      await expect(runtime.downloadFile("f", "c")).rejects.toThrow(
        "comm error"
      );
    });

    it("should handle failed speakText", async () => {
      (chrome.tabs.sendMessage as jest.Mock).mockResolvedValue({
        success: false,
        error: "speak failed",
      });
      await expect(runtime.speakText("t")).rejects.toThrow("speak failed");

      (chrome.runtime as any).lastError = { message: "comm error" };
      await expect(runtime.speakText("t")).rejects.toThrow("comm error");
    });

    it("should handle failed showTooltip", async () => {
      (chrome.tabs.sendMessage as jest.Mock).mockResolvedValue({
        success: false,
        error: "tooltip failed",
      });
      await expect(runtime.showTooltip("s", "c")).rejects.toThrow(
        "tooltip failed"
      );

      (chrome.runtime as any).lastError = { message: "comm error" };
      await expect(runtime.showTooltip("s", "c")).rejects.toThrow("comm error");
    });

    it("should showAlert correctly", async () => {
      (chrome.tabs.sendMessage as jest.Mock).mockResolvedValue({
        success: true,
      });
      await runtime.showAlert("alert-msg");
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(1, {
        type: "SHOW_ALERT",
        message: "alert-msg",
      });
    });

    it("should replaceDOM correctly", async () => {
      (chrome.tabs.sendMessage as jest.Mock).mockResolvedValue({
        success: true,
      });
      await runtime.replaceDOM("div", "new content", true, 0);
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(1, {
        type: "REPLACE_DOM",
        selector: "div",
        content: "new content",
        isMultiple: true,
        index: 0,
      });
    });

    it("should copyToClipboard correctly", async () => {
      (chrome.tabs.sendMessage as jest.Mock).mockResolvedValue({
        success: true,
      });
      await runtime.copyToClipboard("clip");
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(1, {
        type: "COPY_TO_CLIPBOARD",
        text: "clip",
      });
    });

    it("should downloadFile correctly", async () => {
      (chrome.tabs.sendMessage as jest.Mock).mockResolvedValue({
        success: true,
      });
      await runtime.downloadFile("f.txt", "content");
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(1, {
        type: "DOWNLOAD_FILE",
        filename: "f.txt",
        content: "content",
      });
    });

    it("should speakText correctly", async () => {
      (chrome.tabs.sendMessage as jest.Mock).mockResolvedValue({
        success: true,
      });
      await runtime.speakText("hello");
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(1, {
        type: "SPEAK_TEXT",
        text: "hello",
      });
    });

    it("should showTooltip correctly", async () => {
      (chrome.tabs.sendMessage as jest.Mock).mockResolvedValue({
        success: true,
      });
      await runtime.showTooltip("div", "tip");
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(1, {
        type: "SHOW_TOOLTIP",
        selector: "div",
        content: "tip",
      });
    });
  });

  describe("Node Callbacks", () => {
    let callbacks: any;
    beforeEach(() => {
      callbacks = {
        onNodeStart: jest.fn(),
        onNodeFinish: jest.fn(),
        onError: jest.fn(),
      };
      runtime.setCallbacks(callbacks);
    });

    it("should trigger onNodeStart", () => {
      runtime.onNodeStart("n1");
      expect(callbacks.onNodeStart).toHaveBeenCalledWith("n1");
    });

    it("should trigger onNodeFinish", () => {
      runtime.onNodeFinish("n1", { status: "success", data: "d" });
      expect(callbacks.onNodeFinish).toHaveBeenCalledWith("n1", {
        status: "success",
        data: "d",
      });
    });

    it("should trigger onError", () => {
      const err = new Error("fail");
      runtime.onError(err);
      expect(callbacks.onError).toHaveBeenCalledWith(err);
    });
  });
});
