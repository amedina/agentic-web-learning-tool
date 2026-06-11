/**
 * Internal dependencies
 */
import tabOnCreatedCallback from "./tabOnCreatedCallback";
import onActionClickedCallback from "./onActionClickedCallback";
import onInstalledCallback from "./onInstalledCallback";

const openedTabs = new Set<number>();

chrome.tabs.onCreated.addListener(tabOnCreatedCallback);
chrome.action.onClicked.addListener((event) =>
  onActionClickedCallback(event, openedTabs),
);
chrome.runtime.onInstalled.addListener(onInstalledCallback);
chrome.management.onEnabled.addListener(onInstalledCallback);
