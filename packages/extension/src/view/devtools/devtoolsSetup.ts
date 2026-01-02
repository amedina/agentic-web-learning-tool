const callback = (panel: {
  onShown: { addListener: (arg0: () => void) => void };
  onHidden: { addListener: (arg0: () => void) => void };
}) => {
  // Fires when the user switches to the panel.
  panel.onShown.addListener(async () => {
    if (!chrome.runtime?.id) {
      return;
    }

    await chrome.storage.session.set({
      [chrome.devtools.inspectedWindow.tabId + '-privacySandboxPanelVisible']:
        true,
    });
  });

  panel.onHidden.addListener(async () => {
    if (!chrome.runtime?.id) {
      return;
    }

    await chrome.storage.session.set({
      [chrome.devtools.inspectedWindow.tabId + '-privacySandboxPanelVisible']:
        false,
    });
  });
};
chrome.devtools.panels.create(
  'AWL Tool',
  'icons/icon.svg',
  'devtools/index.html',
  callback
);