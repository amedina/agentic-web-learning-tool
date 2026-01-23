/**
 * External dependencies
 */
import type { RuntimeInterface, NodeOutput } from "@google-awlt/engine-core";

export interface ExecutionCallbacks {
  onNodeStart?: (nodeId: string) => void;
  onNodeFinish?: (nodeId: string, output: NodeOutput) => void;
  onError?: (error: Error) => void;
}

export class WebRuntime implements RuntimeInterface {
  private callbacks: ExecutionCallbacks = {};

  public setCallbacks(callbacks: ExecutionCallbacks): void {
    this.callbacks = callbacks;
  }

  async checkCapability(capability: string, options?: any): Promise<boolean> {
    try {
      switch (capability) {
        case "promptApi": {
          let available = "LanguageModel" in self;
          // @ts-ignore
          const status = await LanguageModel.availability();
          available = available && status !== "unavailable";

          return available;
        }

        case "writerApi": {
          let available = "Writer" in self;
          // @ts-ignore
          const status = await Writer.availability();
          available = available && status !== "unavailable";

          return available;
        }

        case "rewriterApi": {
          let available = "Rewriter" in self;
          // @ts-ignore
          const status = await Rewriter.availability();
          available = available && status !== "unavailable";

          return available;
        }

        case "summarizerApi": {
          let available = "Summarizer" in self;
          // @ts-ignore
          const status = await Summarizer.availability();
          available = available && status !== "unavailable";

          return available;
        }

        case "translatorApi": {
          let available = "Translator" in self;
          // @ts-ignore
          const status = await Translator.availability(options);
          available = available && status !== "unavailable";

          return available;
        }

        case "languageDetectorApi": {
          let available = "LanguageDetector" in self;
          // @ts-ignore
          const status = await LanguageDetector.availability();
          available = available && status !== "unavailable";

          return available;
        }

        case "proofreaderApi": {
          let available = "Proofreader" in self;
          // @ts-ignore
          const status = await Proofreader.availability();
          available = available && status !== "unavailable";

          return available;
        }

        // JS tools are always available in the webpage
        case "staticInput":
        case "domInput":
        case "alertNotification":
        case "condition":
        case "domQuery":
        case "domReplacement":
        case "clipboard":
        case "fileCreator":
        case "speechGenerator":
        case "toastNotification":
          return true;

        default:
          return false;
      }
    } catch (error) {
      console.error("Workflow", error);
      return false;
    }
  }

  async getStorage(key: string): Promise<unknown> {
    const value = localStorage.getItem(key);
    if (value === null) return undefined;

    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  async setStorage(key: string, value: unknown): Promise<void> {
    const stringValue =
      typeof value === "string" ? value : JSON.stringify(value);

    localStorage.setItem(key, stringValue);
  }

  async queryPage(
    selector: string,
    extract:
      | "textContent"
      | "innerText"
      | "innerHTML"
      | "value"
      | "src"
      | "href",
    isMultiple?: boolean,
  ): Promise<string | string[]> {
    const elements = document.querySelectorAll(selector);

    if (!elements || elements.length === 0) {
      return isMultiple ? [] : "";
    }

    const extractValue = (element: Element): string => {
      switch (extract) {
        case "textContent":
          return element.textContent ?? "";
        case "innerText":
          return (element as HTMLElement).innerText ?? "";
        case "innerHTML":
          return element.innerHTML ?? "";
        case "value":
          return (element as HTMLInputElement).value ?? "";
        case "src":
          return (element as HTMLImageElement).src ?? "";
        case "href":
          return (element as HTMLAnchorElement).href ?? "";
        default:
          return element.textContent ?? "";
      }
    };

    if (isMultiple) {
      return Array.from(elements).map(extractValue);
    } else {
      return extractValue(elements[0]);
    }
  }

  async showAlert(message: string): Promise<void> {
    window.alert(message);
  }

  async replaceDOM(
    selector: string,
    content: string,
    isMultiple?: boolean,
    index?: number,
  ): Promise<void> {
    if (typeof index === "number") {
      const elements = document.querySelectorAll(selector);

      if (!elements || elements.length <= index) {
        throw new Error(
          `No element found at index ${index} for selector: ${selector}`,
        );
      }

      elements[index].textContent = content;
    } else if (isMultiple) {
      const elements = document.querySelectorAll(selector);

      elements.forEach((el) => {
        el.textContent = content;
      });
    } else {
      const element = document.querySelector(selector);

      if (!element) {
        throw new Error(`No element found for selector: ${selector}`);
      }

      element.textContent = content;
    }
  }

  async copyToClipboard(text: string): Promise<void> {
    await navigator.clipboard.writeText(text);
  }

  async downloadFile(filename: string, content: string): Promise<void> {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async speakText(text: string): Promise<void> {
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  }

  async showTooltip(selector: string, content: string): Promise<void> {
    const el = document.querySelector(selector);
    if (!el) return;

    const tooltip = document.createElement("div");
    tooltip.textContent = content;
    Object.assign(tooltip.style, {
      position: "absolute",
      background: "#333",
      color: "#fff",
      padding: "5px 10px",
      borderRadius: "4px",
      zIndex: "10000",
      fontSize: "12px",
    });

    const rect = el.getBoundingClientRect();
    tooltip.style.top = `${rect.top + window.scrollY - 30}px`;
    tooltip.style.left = `${rect.left + window.scrollX}px`;

    document.body.appendChild(tooltip);
    setTimeout(() => tooltip.remove(), 3000);
  }

  onNodeStart(nodeId: string): void {
    this.callbacks.onNodeStart?.(nodeId);
  }

  onNodeFinish(nodeId: string, output: NodeOutput): void {
    this.callbacks.onNodeFinish?.(nodeId, output);
  }

  onError(error: Error): void {
    this.callbacks.onError?.(error);
  }
}
