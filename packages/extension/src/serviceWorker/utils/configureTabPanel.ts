/**
 * Internal dependencies
 */
import { logger } from "../../utils";

/**
 * Ensure a tab-specific side panel is configured before opening
 * @param tabId - The tab ID to attach the panel to
 */
async function configureTabPanel(tabId: number): Promise<void> {
  const path = `sidePanel/sidePanel.html#tab=${tabId}`;
  try {
    await chrome.sidePanel.setOptions({
      tabId,
      path,
      enabled: true,
    });
    logger(['debug'], [`Side panel configured for tab ${tabId}`]);

    // Store sidebar binding in session storage for persistence
    await chrome.storage.session.set({
      [`sidebar_tab_${tabId}`]: {
        tabId,
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    logger(['error'], [`Failed to configure side panel for tab ${tabId}:`, error]);
    throw error;
  }
}

export default configureTabPanel;
