/**
 * Internal dependencies
 */
import syncStorageChangeCallback from "./syncStorageChangeCallback";
import onInstalledCallback from "./onInstalledListener";

chrome.storage.sync.onChanged.addListener(syncStorageChangeCallback);

chrome.runtime.onInstalled.addListener(onInstalledCallback);
