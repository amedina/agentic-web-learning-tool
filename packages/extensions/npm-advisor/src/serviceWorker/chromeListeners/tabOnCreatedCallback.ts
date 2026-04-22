/**
 * External dependencies
 */
import { logger } from "@google-awlt/common";
/**
 * Internal dependencies
 */
import { configureTabPanel } from "../utils";

const tabOnCreatedCallback = async (tab: chrome.tabs.Tab) => {
  if (tab.id) {
    try {
      await configureTabPanel(tab.id);
      logger(["debug"], ["Pre-configured panel for new tab:", tab.id]);
    } catch (error) {
      // Non-critical - panel will be configured on first click
      logger(
        ["debug"],
        ["Could not pre-configure panel for tab:", tab.id, error],
      );
    }
  }
};

export default tabOnCreatedCallback;
