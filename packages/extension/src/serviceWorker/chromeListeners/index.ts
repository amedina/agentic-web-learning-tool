/**
 * Internal dependencies
 */
import syncStorageChangeCallback from './syncStorageChangeCallback';
import onInstalledCallback from './onInstalledCallback';
import tabOnActivatedCallback from './tabOnActivatedCallback';
import tabOnCreatedCallback from './tabOnCreatedCallback';
import onActionClickedCallback from './onActionClickedCallback';
import onCompletedCallback from './onCompletedCallback';

chrome.storage.sync.onChanged.addListener(syncStorageChangeCallback);
chrome.runtime.onInstalled.addListener(onInstalledCallback);
chrome.tabs.onActivated.addListener(tabOnActivatedCallback);
chrome.tabs.onCreated.addListener(tabOnCreatedCallback);
chrome.action.onClicked.addListener(onActionClickedCallback);
chrome.webNavigation.onCompleted.addListener(onCompletedCallback);
