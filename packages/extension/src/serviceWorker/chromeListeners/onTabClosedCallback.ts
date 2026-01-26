/**
 * Internal dependencies
 */
import { dbConnection } from '../../view/sidePanel/customRuntime/dbConnection';

const onTabClosedCallback = async (
  tabId: number,
  details: chrome.tabs.OnRemovedInfo
) => {
  if (!details.isWindowClosing) {
    return;
  }

  const threads = await dbConnection.threads.findAll();
  const threadForTab = threads.find((thread) => thread.tabId === tabId);
  if (threadForTab) {
    dbConnection.messages.deleteByThreadId(threadForTab.remoteId);
    dbConnection.threads.delete(threadForTab.remoteId);
  }
};

export default onTabClosedCallback;
