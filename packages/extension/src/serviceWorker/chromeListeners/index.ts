/**
 * Internal dependencies
 */
import syncStorageChangeCallback from './syncStorageChangeCallback';
import onInstalledCallback from './onInstalledCallback';
import onTabClosedCallback from './onTabClosedCallback';
import tabOnActivatedCallback from './tabOnActivatedCallback';
import tabOnCreatedCallback from './tabOnCreatedCallback';
import onActionClickedCallback from './onActionClickedCallback';

chrome.storage.sync.onChanged.addListener(syncStorageChangeCallback);
chrome.runtime.onInstalled.addListener(onInstalledCallback);
chrome.tabs.onRemoved.addListener(onTabClosedCallback);
chrome.tabs.onActivated.addListener(tabOnActivatedCallback);
chrome.tabs.onCreated.addListener(tabOnCreatedCallback);
chrome.action.onClicked.addListener(onActionClickedCallback);
