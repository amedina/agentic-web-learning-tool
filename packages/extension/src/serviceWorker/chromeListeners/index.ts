/**
 * Internal dependencies
 */
import syncStorageChangeCallback from './syncStorageChangeCallback';
import onInstalledCallback from './onInstalledCallback';
import onTabClosedCallback from './onTabClosedCallback';

chrome.storage.sync.onChanged.addListener(syncStorageChangeCallback);
chrome.runtime.onInstalled.addListener(onInstalledCallback);
chrome.tabs.onRemoved.addListener(onTabClosedCallback);
