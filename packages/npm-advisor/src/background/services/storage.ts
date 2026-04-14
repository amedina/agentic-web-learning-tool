/**
 * Storage Service.
 * Encapsulates Chrome storage operations.
 */
export const storageService = {
  /**
   * Get sync storage values.
   */
  async getSync(keys: string | string[]): Promise<any> {
    return new Promise((resolve) => {
      chrome.storage.sync.get(keys, resolve);
    });
  },

  /**
   * Get local storage values.
   */
  async getLocal(keys: string | string[]): Promise<any> {
    return new Promise((resolve) => {
      chrome.storage.local.get(keys, resolve);
    });
  },

  /**
   * Set local storage values.
   */
  async setLocal(data: Record<string, any>): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set(data, resolve);
    });
  },

  /**
   * Set sync storage values.
   */
  async setSync(data: Record<string, any>): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.sync.set(data, resolve);
    });
  },
};
