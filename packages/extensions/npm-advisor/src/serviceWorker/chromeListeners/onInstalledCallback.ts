/**
 * Internal dependencies
 */
import { configureTabPanel } from "../utils";

const onInstalledCallback = async () => {
  try {
    const allTabs = await chrome.tabs.query({});
    Promise.all(
      allTabs.map(async (tab) => {
        if (!tab.id) {
          return;
        }

        configureTabPanel(tab.id);
      }),
    );
  } catch (error) {
    //ignore thrown error
  }
};

export default onInstalledCallback;
