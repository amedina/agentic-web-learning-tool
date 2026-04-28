/**
 * Internal dependencies.
 */
import {
  type StatsClient,
  type BundleData,
} from "@google-awlt/package-analyzer-ui";
import {
  type DependencyCategory,
  type PackageStats,
  type DependencyTree,
} from "@google-awlt/package-analyzer-core";

function sendChromeMessage<T>(
  message: object,
): Promise<{ success: boolean; data?: T; error?: string }> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ success: false, error: chrome.runtime.lastError.message });
        return;
      }
      resolve(response ?? { success: false });
    });
  });
}

export const chromeStatsClient: StatsClient = {
  async getLightStats(
    name: string,
    category: DependencyCategory,
  ): Promise<PackageStats | null> {
    const response = await sendChromeMessage<PackageStats>({
      type: "GET_LIGHT_STATS",
      packageName: name,
      dependencyCategory: category,
    });
    if (!response.success) {
      throw new Error(
        response.error ||
          chrome.runtime.lastError?.message ||
          "Failed to reach background script.",
      );
    }
    return response.data ?? null;
  },

  async getBundleData(name: string): Promise<BundleData | null> {
    const response = await sendChromeMessage<{
      size: number;
      gzip: number;
      hasJSModule: boolean;
      hasSideEffects: boolean | string[];
    }>({ type: "GET_BUNDLE_DATA", packageName: name });
    if (!response.success || !response.data) {
      return null;
    }
    const fetched = response.data;
    return {
      size: fetched.size,
      gzip: fetched.gzip,
      isTreeShakeable: fetched.hasJSModule,
      hasSideEffects: fetched.hasSideEffects,
    };
  },

  async getDependencyTree(
    name: string,
    version?: string,
  ): Promise<DependencyTree | null> {
    const message = version
      ? { type: "FETCH_DEP_TREE", packageName: name, version }
      : { type: "GET_DEP_TREE", packageName: name };
    const response = await sendChromeMessage<DependencyTree>(message);
    if (!response.success) {
      return null;
    }
    return response.data ?? null;
  },
};
