/**
 * External dependencies
 */
import { Menu, Share2, PlusCircle } from 'lucide-react';
import { SidebarTrigger, Tooltip, Button } from '@google-awlt/design-system';
import { usePropProvider } from '@google-awlt/chatbot';

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

  if (!allowChatStorage || !isChatTabActive) {
    return null;
  }

  return (
    <div className="flex items-center w-full px-1 py-1 border-b bg-background">
      <div className="flex items-center">
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
      </div>
    </div>
  );
};
