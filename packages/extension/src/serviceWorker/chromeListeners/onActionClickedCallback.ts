/**
 * Internal dependencies
 */
import { logger, MESSAGE_TYPES } from '../../utils';
import { configureTabPanel } from '../utils';

const onActionClickedCallback = async (tab: chrome.tabs.Tab) => {
  if (tab?.id) {
    const tabId = tab.id;

    const sidebarKey = `sidebar_tab_${tabId}`;

    chrome.storage.session.get(
      sidebarKey,
      (result: {
        [key: string]: {
          tabId: number;
          isOpen: boolean;
          timestamp: number;
        };
      }) => {
        if (result[sidebarKey]?.isOpen) {
          chrome.runtime.sendMessage(
            {
              type: MESSAGE_TYPES.CLOSE_SIDEPANEL,
              payload: {
                tabId,
              },
            },
            () => {
              if (chrome.runtime.lastError) {
                logger(
                  ['error'],
                  [
                    'Failed to close side panel:',
                    chrome.runtime.lastError.message,
                  ]
                );
              }
            }
          );
          chrome.storage.session.set({
            [`sidebar_tab_${tabId}`]: {
              tabId,
              isOpen: false,
              timestamp: Date.now(),
            },
          });
          return;
        } else {
          // Using callback instead of async/await because we need to handle chrome.runtime.lastError
          // Try to open immediately (synchronously) - panel might already be configured
          chrome.sidePanel.open({ tabId }, () => {
            if (chrome.runtime.lastError) {
              logger(
                ['debug'],
                [
                  'Panel not configured yet, configuring now:',
                  chrome.runtime.lastError.message,
                ]
              );

              // Configure the panel and try again
              configureTabPanel(tabId)
                .then(() => {
                  // Try opening again after configuration
                  chrome.sidePanel.open({ tabId }, () => {
                    if (chrome.runtime.lastError) {
                      logger(
                        ['error'],
                        [
                          'Still failed to open after configuration:',
                          chrome.runtime.lastError,
                        ]
                      );
                    } else {
                      chrome.storage.session.set({
                        [`sidebar_tab_${tabId}`]: {
                          tabId,
                          isOpen: true,
                          timestamp: Date.now(),
                        },
                      });
                      logger(
                        ['debug'],
                        ['Panel opened after configuration for tab:', tabId]
                      );
                    }
                  });
                })
                .catch((error) => {
                  logger(['error'], ['Failed to configure panel:', error]);
                });
            } else {
              logger(['debug'], ['Panel opened immediately for tab:', tabId]);
              configureTabPanel(tabId)
                .catch(() => {})
                .then(() => {
                  chrome.storage.session.set({
                    [`sidebar_tab_${tabId}`]: {
                      tabId,
                      isOpen: true,
                      timestamp: Date.now(),
                    },
                  });
                });
            }
          });
        }
      }
    );
  }
};

export default onActionClickedCallback;
