/**
 * Internal dependencies
 */
import logger from './logger';

const openOptionsPage = async () => {
  try {
    const optionsPageUrl = `chrome-extension://${chrome.runtime.id}/options/options.html`;
    const tabs = await chrome.tabs.query({});
    const currentTab = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    const preExistingOptionsPage = tabs.filter(
      (tab) => tab.url && tab.url === optionsPageUrl
    )?.[0];

    if (preExistingOptionsPage?.id) {
      await chrome.tabs.update(preExistingOptionsPage.id, { active: true });
    } else {
      await chrome.tabs.create({
        url: optionsPageUrl,
        index: currentTab?.[0]?.index,
      });
    }
  } catch (error) {
    logger(['error'], [error]);
  }
};

export default openOptionsPage;
