/**
 * Internal dependencies
 */
import syncStorageChangeCallback from './syncStorageChangeCallback';
import onInstalledCallback from './onInstalledCallback';
import onWindowClosedCallback from './onWindowClosedCallback';

chrome.storage.sync.onChanged.addListener(syncStorageChangeCallback);
chrome.runtime.onInstalled.addListener(onInstalledCallback);
chrome.windows.onRemoved.addListener(onWindowClosedCallback);
