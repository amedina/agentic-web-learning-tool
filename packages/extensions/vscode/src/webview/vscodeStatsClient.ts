/**
 * External dependencies.
 */
import type {
  DependencyCategory,
  DependencyTree,
  PackageStats,
} from "@agentic-web-labs/package-analyzer-core";
import type {
  BundleData,
  StatsClient,
} from "@agentic-web-labs/package-analyzer-ui";

/**
 * Internal dependencies.
 */
import type { ExtensionMessage, WebviewRequest } from "./protocol";

interface VsCodeApi {
  postMessage(message: WebviewRequest): void;
}

interface PendingResolver {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
  expected: ExtensionMessage["type"];
}

/**
 * Adapter that satisfies the analyzer-ui StatsClient interface by
 * proxying every call through `acquireVsCodeApi().postMessage` to the
 * extension host. The host owns the StatsCache and analyzer-core, so
 * the webview never fetches anything itself.
 */
export class VsCodeStatsClient implements StatsClient {
  private readonly api: VsCodeApi;
  private readonly pending = new Map<string, PendingResolver>();
  private requestCounter = 0;

  /**
   * Wires the client to the VSCode webview API and starts listening
   * for response messages from the extension host.
   */
  constructor(api: VsCodeApi) {
    this.api = api;
    window.addEventListener("message", this.handleMessage);
  }

  /** Forwards a getLightStats call to the extension host. */
  getLightStats(
    name: string,
    category: DependencyCategory,
  ): Promise<PackageStats | null> {
    return this.request<PackageStats | null>("lightStats", {
      type: "getLightStats",
      requestId: this.nextRequestId(),
      packageName: name,
      category,
    });
  }

  /** Forwards a getBundleData call to the extension host. */
  getBundleData(name: string): Promise<BundleData | null> {
    return this.request<BundleData | null>("bundleData", {
      type: "getBundleData",
      requestId: this.nextRequestId(),
      packageName: name,
    });
  }

  /** Forwards a getDependencyTree call to the extension host. */
  getDependencyTree(
    name: string,
    version?: string,
  ): Promise<DependencyTree | null> {
    return this.request<DependencyTree | null>("dependencyTree", {
      type: "getDependencyTree",
      requestId: this.nextRequestId(),
      packageName: name,
      version,
    });
  }

  /**
   * Generic request helper that posts the message and stores a
   * pending promise keyed by requestId. The promise resolves once the
   * extension host posts back a response with a matching id.
   */
  private request<T>(
    expected: ExtensionMessage["type"],
    message: WebviewRequest & { requestId: string },
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.pending.set(message.requestId, {
        resolve: resolve as (value: unknown) => void,
        reject,
        expected,
      });
      this.api.postMessage(message);
    });
  }

  /**
   * Window message handler. Only routes responses that match a
   * pending requestId; init / focusPackage are handled elsewhere.
   */
  private readonly handleMessage = (event: MessageEvent): void => {
    const data = event.data as ExtensionMessage | undefined;
    if (!data || typeof data !== "object" || !("type" in data)) {
      return;
    }
    if (
      data.type !== "lightStats" &&
      data.type !== "bundleData" &&
      data.type !== "dependencyTree"
    ) {
      return;
    }
    const pending = this.pending.get(data.requestId);
    if (!pending) {
      return;
    }
    this.pending.delete(data.requestId);
    if (data.ok) {
      pending.resolve(data.data);
    } else {
      pending.reject(new Error(data.error));
    }
  };

  /** Monotonically increasing request id used for response matching. */
  private nextRequestId(): string {
    this.requestCounter += 1;
    return `${Date.now()}-${this.requestCounter}`;
  }
}
