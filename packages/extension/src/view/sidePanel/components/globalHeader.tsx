/**
 * External dependencies
 */
import { Menu, Share2, PlusCircle, Settings } from 'lucide-react';
import { SidebarTrigger, Tooltip, Button } from '@google-awlt/design-system';
import { usePropProvider, openOptionsPage } from '@google-awlt/chatbot';

export const GlobalHeader = () => {
  const {
    allowChatStorage,
    activeTab,
    exportChatCallback,
    switchToNewThreadRef,
    triggerExportChatRef,
  } = usePropProvider(({ state, actions }) => ({
    allowChatStorage: state.allowChatStorage,
    activeTab: state.activeTab,
    exportChatCallback: actions.exportChatCallback,
    switchToNewThreadRef: actions.switchToNewThreadRef,
    triggerExportChatRef: actions.triggerExportChatRef,
  }));

  const isChatTabActive = activeTab === 'chat';

  return (
    <div className="flex items-center justify-between w-full px-1 border-b bg-background h-10 shrink-0">
      <div className="flex items-center">
        {allowChatStorage && isChatTabActive && (
          <>
            <Tooltip text="Chat History">
              <SidebarTrigger>
                <Menu className="text-primary" size={16} />
              </SidebarTrigger>
            </Tooltip>
            {exportChatCallback && (
              <Tooltip text="Share Conversation">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => triggerExportChatRef.current?.()}
                >
                  <Share2 className="text-primary" size={16} />
                </Button>
              </Tooltip>
            )}
            <Tooltip text="New Chat">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => switchToNewThreadRef.current?.()}
              >
                <PlusCircle className="text-primary" size={16} />
              </Button>
            </Tooltip>
          </>
        )}
      </div>
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={openOptionsPage}
          title="Settings"
          className="text-muted-foreground hover:text-foreground"
        >
          <Settings size={16} />
        </Button>
      </div>
    </div>
  );
};
