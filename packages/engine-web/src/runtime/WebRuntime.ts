/**
 * External dependencies
 */
import {
  type RuntimeInterface,
  type NodeOutput,
  userActivationManager,
} from "@google-awlt/engine-core";

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
        case "selectionInput":
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
    mode: "textContent" | "innerText" | "innerHTML" | "value" = "textContent",
    index?: number,
  ): Promise<void> {
    const updateElement = (element: Element) => {
      switch (mode) {
        case "innerHTML":
          element.innerHTML = content;
          break;
        case "innerText":
          (element as HTMLElement).innerText = content;
          break;
        case "value":
          (element as HTMLInputElement).value = content;
          break;
        case "textContent":
        default:
          element.textContent = content;
          break;
      }
    };

    if (typeof index === "number") {
      const elements = document.querySelectorAll(selector);

      if (!elements || elements.length <= index) {
        throw new Error(
          `No element found at index ${index} for selector: ${selector}`,
        );
      }

      updateElement(elements[index]);
    } else if (isMultiple) {
      const elements = document.querySelectorAll(selector);

      if (!elements || elements.length === 0) {
        throw new Error(`No elements found for selector: ${selector}`);
      }

      elements.forEach((el) => {
        updateElement(el);
      });
    } else {
      const element = document.querySelector(selector);

      if (!element) {
        throw new Error(`No element found for selector: ${selector}`);
      }

      updateElement(element);
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

  async waitForUserActivation(): Promise<void> {
    await userActivationManager.requestActivation();
  }

  async isUserActive(): Promise<boolean> {
    // @ts-ignore
    return !!navigator.userActivation?.isActive;
  }

  async waitForSelection(): Promise<string> {
    const container = document.createElement("div");
    container.id = "awl-selection-overlay";

    Object.assign(container.style, {
      position: "fixed",
      bottom: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      background: "#fff",
      padding: "16px 24px",
      borderRadius: "12px",
      boxShadow: "0 10px 25px rgba(0,0,0,0.1), 0 4px 10px rgba(0,0,0,0.05)",
      zIndex: "2147483647",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      border: "1px solid #e2e8f0",
      minWidth: "300px",
      fontFamily: "Inter, system-ui, sans-serif",
    });

    const header = document.createElement("div");
    Object.assign(header.style, {
      display: "flex",
      alignItems: "center",
      gap: "8px",
    });

    const indicator = document.createElement("div");
    Object.assign(indicator.style, {
      width: "8px",
      height: "8px",
      borderRadius: "50%",
      background: "#3b82f6",
      boxShadow: "0 0 8px #3b82f6",
    });

    const title = document.createElement("span");
    title.textContent = "Workflow Paused";
    Object.assign(title.style, {
      fontSize: "14px",
      fontWeight: "700",
      color: "#1e293b",
    });

    header.appendChild(indicator);
    header.appendChild(title);

    const message = document.createElement("p");
    message.textContent = "Please select text on the page...";
    Object.assign(message.style, {
      margin: "0",
      fontSize: "13px",
      color: "#64748b",
      lineHeight: "1.5",
    });

    const finishBtn = document.createElement("button");
    finishBtn.textContent = "Finish Selection";
    finishBtn.disabled = true;
    Object.assign(finishBtn.style, {
      padding: "8px 16px",
      background: "#3b82f6",
      color: "#fff",
      border: "none",
      borderRadius: "6px",
      fontSize: "13px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.2s",
      opacity: "0.5",
    });

    container.appendChild(header);
    container.appendChild(message);
    container.appendChild(finishBtn);
    document.body.appendChild(container);

    return new Promise((resolve) => {
      const updateSelection = () => {
        const selection = window.getSelection()?.toString().trim();
        if (selection && selection.length > 0) {
          message.textContent = `Text captured (${selection.length} chars)`;
          finishBtn.disabled = false;
          finishBtn.style.opacity = "1";
        } else {
          message.textContent = "Please select text on the page...";
          finishBtn.disabled = true;
          finishBtn.style.opacity = "0.5";
        }
      };

      document.addEventListener("selectionchange", updateSelection);

      finishBtn.onclick = () => {
        const finalSelection = window.getSelection()?.toString().trim() || "";
        document.removeEventListener("selectionchange", updateSelection);
        container.remove();
        resolve(finalSelection);
      };
    });
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
