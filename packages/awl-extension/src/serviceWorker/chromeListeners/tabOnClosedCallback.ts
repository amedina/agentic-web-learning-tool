/**
 * External dependencies
 */
import type { WebMCPTool } from '@google-awlt/design-system';

const tabOnClosedCallback = async (tabId: number) => {
  //@ts-expect-error -- PromiseQueue is added to globalThis in service worker
  globalThis.PromiseQueue.add(async () => {
    const { userWebMCPTools = [] }: { userWebMCPTools: WebMCPTool[] } =
      await chrome.storage.local.get('userWebMCPTools');
    const updatedUserWebMCPTools = userWebMCPTools.map((tool) => {
      if (tool?.editedScript?.tabId.includes(tabId)) {
        tool.editedScript.tabId = tool.editedScript.tabId.filter(
          (id) => id !== tabId
        );
      }
      return tool;
    });
    await chrome.storage.local.set({ userWebMCPTools: updatedUserWebMCPTools });
  });
};

export default tabOnClosedCallback;
