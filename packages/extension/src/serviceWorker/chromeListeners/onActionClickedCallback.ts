/**
 * Internal dependencies
 */
import { logger } from "../../utils";
import { configureTabPanel } from "../utils";

const onActionClickedCallback = (tab: chrome.tabs.Tab) => {
  if (tab?.id) {
    const tabId = tab.id;
    // Using callback instead of async/await because we need to handle chrome.runtime.lastError
    // Try to open immediately (synchronously) - panel might already be configured
    chrome.sidePanel.open({ tabId }, () => {
      if (chrome.runtime.lastError) {
        logger(['debug'], ['Panel not configured yet, configuring now:', chrome.runtime.lastError.message]);

        // Configure the panel and try again
        configureTabPanel(tabId)
          .then(() => {
            // Try opening again after configuration
            chrome.sidePanel.open({ tabId }, () => {
              if (chrome.runtime.lastError) {
                logger(['error'], ['Still failed to open after configuration:', chrome.runtime.lastError]);
              } else {
                logger(['debug'],['Panel opened after configuration for tab:', tabId]);
              }
            });
          })
          .catch((error) => {
            logger(['error'], ['Failed to configure panel:', error]);
          });
      } else {
        logger(['debug'],['Panel opened immediately for tab:', tabId]);
        configureTabPanel(tabId).catch(() => {});
      }
    });
  }
}

export default onActionClickedCallback;
