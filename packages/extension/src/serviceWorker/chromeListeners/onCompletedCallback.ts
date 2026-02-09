/**
 * Internal dependencies
 */
import { START_MCP_CONNECTION } from '../../constants';
import { logger } from '../../utils';

const onCompletedCallback = async (
  details: chrome.webNavigation.WebNavigationFramedCallbackDetails
) => {
  if (details.frameId !== 0) {
    return;
  }

  if (details.url.startsWith('chrome://')) {
    return;
  }

  try {
    await chrome.tabs.sendMessage(details.tabId, {
      type: START_MCP_CONNECTION,
    });
    if (chrome.runtime.lastError) {
      logger(['error'], ['Port disconnected due to url change']);
    }
  } catch (error) {
    logger(['error'], ['Failed to send START_MCP_CONNECTION message:', error]);
  }
};

export default onCompletedCallback;
