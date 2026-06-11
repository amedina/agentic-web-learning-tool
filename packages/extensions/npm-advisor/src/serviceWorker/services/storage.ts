/**
 * Storage Service.
 * Encapsulates Chrome storage operations.
 */
export const storageService = {
  /**
   * Get sync storage values.
   */
  async getSync(keys: string | string[]): Promise<Record<string, unknown>> {
    return new Promise((resolve) => {
      chrome.storage.sync.get(keys, (result) =>
        resolve(result as Record<string, unknown>),
      );
    });
  },

  /**
   * Get local storage values.
   */
  async getLocal(keys: string | string[]): Promise<Record<string, unknown>> {
    return new Promise((resolve) => {
      chrome.storage.local.get(keys, (result) =>
        resolve(result as Record<string, unknown>),
      );
    });
  },

  /**
   * Set local storage values.
   */
  async setLocal(data: Record<string, unknown>): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set(data, resolve);
    });
  },

  /**
   * Set sync storage values.
   */
  async setSync(data: Record<string, unknown>): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.sync.set(data, resolve);
    });
  },
};
