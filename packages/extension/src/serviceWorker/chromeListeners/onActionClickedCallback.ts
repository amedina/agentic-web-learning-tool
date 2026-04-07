/**
 * External dependencies
 */
import { logger } from '@google-awlt/common';
/**
 * Internal dependencies
 */
import { configureTabPanel } from '../utils';

const onActionClickedCallback = async (
  tab: chrome.tabs.Tab,
  openedTabs: Set<number>
) => {
  if (!tab?.id) {
    return;
  }

  const tabId = tab.id;
  const sidebarKey = `sidebar_tab_${tabId}`;

  const isSidePanelOpen = openedTabs.has(tabId);

  if (isSidePanelOpen) {
    chrome.sidePanel.close({ tabId });
    openedTabs.delete(tabId);
    chrome.storage.session.set({
      [sidebarKey]: {
        tabId,
        timestamp: Date.now(),
      },
    });
    return;
  }

  try {
    // Try to open immediately - panel might already be configured
    chrome.sidePanel.open({ tabId });
    openedTabs.add(tabId);
    logger(['debug'], ['Panel opened immediately for tab:', tabId]);

    try {
      configureTabPanel(tabId);
    } catch {
      // ignore
    }

    chrome.storage.session.set({
      [sidebarKey]: {
        tabId,
        timestamp: Date.now(),
      },
    });

    return;
  } catch (error) {
    logger(
      ['debug'],
      [
        'Panel not configured yet, configuring now:',
        (error as Error).message || error,
      ]
    );
  }

  try {
    // Configure the panel and try again
    configureTabPanel(tabId);
  } catch (error) {
    logger(['error'], ['Failed to configure panel:', error]);
    return;
  }

  try {
    // Try opening again after configuration
    chrome.sidePanel.open({ tabId });
    openedTabs.add(tabId);
    chrome.storage.session.set({
      [sidebarKey]: {
        tabId,
        timestamp: Date.now(),
      },
    });
    logger(['debug'], ['Panel opened after configuration for tab:', tabId]);
  } catch (error) {
    logger(['error'], ['Still failed to open after configuration:', error]);
  }
};

export default onActionClickedCallback;
