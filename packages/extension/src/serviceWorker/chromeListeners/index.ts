/**
 * Internal dependencies
 */
import syncStorageChangeCallback from "./syncStorageChangeCallback";
import onInstalledCallback from "./onInstalledListener";
import onActionClickedCallback from "./onActionClickCallback";

chrome.storage.sync.onChanged.addListener(syncStorageChangeCallback);
chrome.action.onClicked.addListener(onActionClickedCallback);
chrome.runtime.onInstalled.addListener(onInstalledCallback);
