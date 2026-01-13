/**
 * Internal dependencies
 */
import syncStorageChangeCallback from './syncStorageChangeCallback';
import onInstalledCallback from './onInstalledCallback';
import tabOnActivatedCallback from './tabOnActivatedCallback';
import tabOnCreatedCallback from './tabOnCreatedCallback';

chrome.storage.sync.onChanged.addListener(syncStorageChangeCallback);
chrome.runtime.onInstalled.addListener(onInstalledCallback);
chrome.tabs.onActivated.addListener(tabOnActivatedCallback);
chrome.tabs.onCreated.addListener(tabOnCreatedCallback);
