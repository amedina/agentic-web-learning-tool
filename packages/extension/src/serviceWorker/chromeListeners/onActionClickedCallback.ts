/**
 * Internal dependencies
 */
import { logger } from '../../utils';
import { configureTabPanel } from '../utils';

const onActionClickedCallback = async (tab: chrome.tabs.Tab) => {
  if (!tab?.id) {
    return;
  }

  const tabId = tab.id;
  const sidebarKey = `sidebar_tab_${tabId}`;

  const contexts = await chrome.runtime.getContexts({
    contextTypes: ['SIDE_PANEL'],
  });

  const isSidePanelOpen = contexts.some((context) =>
    context.documentUrl?.endsWith(tabId.toString())
  );

  if (isSidePanelOpen) {
    await chrome.sidePanel.close({ tabId });
    await chrome.storage.session.set({
      [sidebarKey]: {
        tabId,
        timestamp: Date.now(),
      },
    });
    return;
  }

  try {
    // Try to open immediately - panel might already be configured
    await chrome.sidePanel.open({ tabId });
    logger(['debug'], ['Panel opened immediately for tab:', tabId]);

    try {
      await configureTabPanel(tabId);
    } catch {
      // ignore
    }

    await chrome.storage.session.set({
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
    await configureTabPanel(tabId);
  } catch (error) {
    logger(['error'], ['Failed to configure panel:', error]);
    return;
  }

  try {
    // Try opening again after configuration
    await chrome.sidePanel.open({ tabId });
    await chrome.storage.session.set({
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
