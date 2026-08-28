/**
 * External dependencies
 */
import { logger } from '@agentic-web-labs/common';
/**
 * Internal dependencies
 */
import syncStorageChangeCallback from './syncStorageChangeCallback';
import onInstalledCallback from './onInstalledCallback';
import tabOnActivatedCallback from './tabOnActivatedCallback';
import tabOnCreatedCallback from './tabOnCreatedCallback';
import onActionClickedCallback from './onActionClickedCallback';
import onCompletedCallback from './onCompletedCallback';
import tabOnClosedCallback from './tabOnClosedCallback';
import { configureTabPanel } from '../utils';

const openedTabs = new Set<number>();

// Bookkeeping for a tab that no longer has a panel. Fire-and-forget: nothing
// downstream depends on the write, but an unhandled rejection here would
// surface in the service worker.
const forgetSidebarTab = (tabId: number) => {
  chrome.storage.session.remove(`sidebar_tab_${tabId}`).catch((error) => {
    logger(['debug'], ['Failed to clear sidebar key for tab:', tabId, error]);
  });
};

// Chrome reports when the panel actually opens or closes - including closes we
// never initiated, like the user hitting the panel's own close button. Without
// this the toggle state goes stale and the next action click tries to close a
// panel that is not there.
if ('onClosed' in chrome.sidePanel) {
  chrome.sidePanel.onClosed.addListener(({ tabId }) => {
    if (tabId) {
      openedTabs.delete(tabId);
      forgetSidebarTab(tabId);
    }
  });
}

if ('onOpened' in chrome.sidePanel) {
  chrome.sidePanel.onOpened.addListener(({ tabId }) => {
    if (tabId) {
      openedTabs.add(tabId);
    }
  });
}

// Tabs that already existed when this service worker started have never been
// through onCreated/onActivated, so they have no panel path yet and
// sidePanel.open() would reject with "No active side panel for tabId".
(async () => {
  const tabs = await chrome.tabs.query({});
  await Promise.all(
    tabs.map(async (tab) => {
      if (!tab.id) {
        return;
      }
      try {
        await configureTabPanel(tab.id);
      } catch (error) {
        logger(
          ['debug'],
          ['Could not pre-configure panel for tab:', tab.id, error]
        );
      }
    })
  );
})().catch((error) => {
  logger(['error'], ['Failed to pre-configure panels on startup:', error]);
});

chrome.storage.sync.onChanged.addListener(syncStorageChangeCallback);
chrome.runtime.onInstalled.addListener(onInstalledCallback);
chrome.tabs.onActivated.addListener(tabOnActivatedCallback);
chrome.tabs.onCreated.addListener(tabOnCreatedCallback);
chrome.action.onClicked.addListener((event) =>
  onActionClickedCallback(event, openedTabs)
);
chrome.webNavigation.onCompleted.addListener(onCompletedCallback);
chrome.tabs.onRemoved.addListener(tabOnClosedCallback);
chrome.tabs.onRemoved.addListener((tabId) => {
  openedTabs.delete(tabId);
  forgetSidebarTab(tabId);
});
