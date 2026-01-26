/**
 * Internal dependencies
 */
import { dbConnection } from 'src/view/sidePanel/customRuntime/dbConnection';

const onWindowClosedCallback = async (windowId: number) => {
  const tabInCurrentWindows = await chrome.tabs.query({ windowId: windowId });
  if (tabInCurrentWindows.length === 0) {
    return;
  }

  await Promise.all(
    tabInCurrentWindows.map(async (tab) => {
      if (!tab.id) {
        return;
      }
      const threads = await dbConnection.threads.findAll();
      const threadForTab = threads.find((thread) => thread.tabId === tab.id);
      if (threadForTab) {
        dbConnection.messages.deleteByThreadId(threadForTab.remoteId);
      }
    })
  );
};

export default onWindowClosedCallback;
