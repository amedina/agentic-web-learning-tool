/**
 * External dependencies
 */
import { useEffect, useState } from 'react';
import { PropProvider, SidepanelChatbot } from '@google-awlt/chatbot';
/**
 * Internal dependencies
 */
import { WorkflowList, GlobalStatusPill } from './components';

const SidePanel = () => {
  const [activeTab, setActiveTab] = useState<chrome.tabs.Tab | null>(null);

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0) {
          setActiveTab(tabs[0]);
        }
      });

      const handleTabCreatedOrUpdated = () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs.length > 0) {
            setActiveTab(tabs[0]);
          }
        });
      };

      chrome.tabs.onActivated.addListener(handleTabCreatedOrUpdated);
      chrome.tabs.onUpdated.addListener(handleTabCreatedOrUpdated);

      return () => {
        chrome.tabs.onActivated.removeListener(handleTabCreatedOrUpdated);
        chrome.tabs.onUpdated.removeListener(handleTabCreatedOrUpdated);
      };
    }
  }, []);

  useEffect(() => {
    chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
      if (message.type === 'still_there') {
        sendResponse({ status: 'yes', type: 'sidepanel' });
      }
    });
  }, []);

  useEffect(() => {
    return () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs) {
          chrome.storage.session.remove(`sidebar_tab_${tabs[0].id}`);
        }
      });
    };
  }, []);

  return (
    <PropProvider
      allowToolCalling={true}
      extraTabs={[
        {
          value: 'workflow',
          label: 'Workflows',
          content: (
            <WorkflowList
              activeTabId={activeTab?.id}
              activeTabUrl={activeTab?.url}
            />
          ),
        },
      ]}
      footerNode={<GlobalStatusPill />}
      helperTextSet={{
        title: () => 'How can I help you today?',
        description: ({ toolLength }) =>
          `I can help you write code, analyze data, or even check the
                    weather. I have access to ${toolLength} tools`,
      }}
    >
      <SidepanelChatbot />
    </PropProvider>
  );
};

export default SidePanel;
