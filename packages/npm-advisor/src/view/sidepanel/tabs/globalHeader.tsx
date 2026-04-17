/**
 * External dependencies.
 */
import React from "react";
import {
  Settings,
  Moon,
  Sun,
  ExternalLink,
  Menu,
  Download,
  PlusCircle,
} from "lucide-react";
import { SidebarTrigger, Tooltip, Button } from "@google-awlt/design-system";
import { usePropProvider } from "@google-awlt/chatbot";
import { useThread } from "@assistant-ui/react";

/**
 * Internal dependencies.
 */
import { useTheme } from "../context/themeContext";

export const GlobalHeader = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const messages = useThread((state) => state.messages);
  const isThreadEmpty = messages.length === 0;

  const {
    allowChatStorage,
    activeTab,
    exportChatCallback,
    switchToNewThreadRef,
    triggerExportChatRef,
    isOptionsPage,
  } = usePropProvider(({ state, actions }) => ({
    allowChatStorage: state.allowChatStorage,
    activeTab: state.activeTab,
    exportChatCallback: actions.exportChatCallback,
    switchToNewThreadRef: actions.switchToNewThreadRef,
    triggerExportChatRef: actions.triggerExportChatRef,
    isOptionsPage: state.isOptionsPage,
  }));

  const isChatTabActive = activeTab === "chat";

  const handleOpenOptions = () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL("options/options.html"));
    }
  };

  const openComparisons = () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL("options/options.html#comparison"),
    });
  };

  return (
    <div className="flex items-center justify-between w-full px-1 border-b bg-background h-10 shrink-0">
      <div className="flex items-center">
        {(isChatTabActive || isOptionsPage) && (
          <>
            {allowChatStorage && (
              <Tooltip text="Chat History">
                <SidebarTrigger>
                  <Menu className="text-primary" size={16} />
                </SidebarTrigger>
              </Tooltip>
            )}
            {exportChatCallback && (
              <Tooltip text="Download Conversation">
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={isThreadEmpty}
                  onClick={() => triggerExportChatRef.current?.()}
                >
                  <Download className="text-primary" size={16} />
                </Button>
              </Tooltip>
            )}
            <Tooltip text="New Chat">
              <Button
                variant="ghost"
                size="icon"
                disabled={isThreadEmpty}
                onClick={() => switchToNewThreadRef.current?.()}
              >
                <PlusCircle className="text-primary" size={16} />
              </Button>
            </Tooltip>
          </>
        )}
      </div>
      <div className="flex items-center">
        {!isOptionsPage && activeTab === "comparison" && (
          <button
            onClick={openComparisons}
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer text-xs font-medium px-2 py-1 rounded hover:bg-accent"
            title="View in options page"
          >
            <ExternalLink size={14} />
            <span>View in options page</span>
          </button>
        )}

        {!isOptionsPage && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleOpenOptions}
            title="Settings"
            className="text-muted-foreground hover:text-foreground"
          >
            <Settings size={16} />
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="text-muted-foreground hover:text-foreground"
        >
          {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
        </Button>
      </div>
    </div>
  );
};
