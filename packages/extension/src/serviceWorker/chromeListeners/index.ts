/**
 * Internal dependencies
 */
import syncStorageChangeCallback from './syncStorageChangeCallback';
import onInstalledCallback from './onInstalledCallback';
import onTabClosedCallback from './onTabClosedCallback';
import tabOnActivatedCallback from './tabOnActivatedCallback';
import tabOnCreatedCallback from './tabOnCreatedCallback';
import onActionClickedCallback from './onActionClickedCallback';
import { START_MCP_CONNECTION } from '../../constants';

chrome.storage.sync.onChanged.addListener(syncStorageChangeCallback);
chrome.runtime.onInstalled.addListener(onInstalledCallback);
chrome.tabs.onRemoved.addListener(onTabClosedCallback);
chrome.tabs.onActivated.addListener(tabOnActivatedCallback);
chrome.tabs.onCreated.addListener(tabOnCreatedCallback);
chrome.action.onClicked.addListener(onActionClickedCallback);
chrome.webNavigation.onCompleted.addListener(async (details) => {
  if (details.frameId !== 0) {
    return;
  }

  await chrome.tabs.sendMessage(details.tabId, { type: START_MCP_CONNECTION });
});
