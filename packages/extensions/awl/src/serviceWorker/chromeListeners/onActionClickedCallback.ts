/**
 * External dependencies
 */
import { logger } from '@agentic-web-labs/common';
/**
 * Internal dependencies
 */
import { configureTabPanel } from '../utils';

const onActionClickedCallback = (
  tab: chrome.tabs.Tab,
  openedTabs: Set<number>
) => {
  if (!tab?.id) {
    return;
  }

  const tabId = tab.id;
  const sidebarKey = `sidebar_tab_${tabId}`;

  if (openedTabs.has(tabId)) {
    // Drop the tab first: whatever close() reports, the panel is not open
    // after this click.
    openedTabs.delete(tabId);
    chrome.storage.session.remove(sidebarKey);
    chrome.sidePanel.close({ tabId }).catch((error) => {
      // Panel was already gone - closed from its own UI, or replaced by
      // another extension's panel.
      logger(['debug'], ['No panel to close for tab:', tabId, error]);
    });
    return;
  }

  openedTabs.add(tabId);

  // Neither call is awaited: sidePanel.open() only works while the click's
  // user gesture is live, and awaiting anything first spends it. Chrome
  // handles the two calls in the order they were issued, so the panel path is
  // configured before the panel opens.
  configureTabPanel(tabId).catch((error) => {
    logger(['error'], ['Failed to configure panel for tab:', tabId, error]);
  });

  chrome.sidePanel
    .open({ tabId })
    .then(() => {
      chrome.storage.session.set({
        [sidebarKey]: {
          tabId,
          timestamp: Date.now(),
        },
      });
      logger(['debug'], ['Panel opened for tab:', tabId]);
    })
    .catch((error) => {
      // The panel never opened, so the toggle must not think it did.
      openedTabs.delete(tabId);
      logger(['error'], ['Failed to open panel for tab:', tabId, error]);
    });
};

export default onActionClickedCallback;
