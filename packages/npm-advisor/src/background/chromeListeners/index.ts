/**
 * Internal dependencies
 */
import tabOnCreatedCallback from "./tabOnCreatedCallback";
import onActionClickedCallback from "./onActionClickedCallback";

const openedTabs = new Set<number>();

chrome.tabs.onCreated.addListener(tabOnCreatedCallback);
chrome.action.onClicked.addListener((event) =>
  onActionClickedCallback(event, openedTabs),
);
