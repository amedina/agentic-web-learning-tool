/**
 * External dependencies
 */
import { useMemo, useRef, useState, type PropsWithChildren } from 'react';
/**
 * Internal dependencies
 */
import PropProviderContext, { type PropProviderType } from './context';
import type { SidePanelTabProps } from '../../../types';
import type { ChatDataType } from '../../customRuntime/types';

type PropProviderProps = PropsWithChildren & {
  footerNode: React.ReactNode;
  subHeaderNode?: React.ReactNode;
  prefixTabs?: SidePanelTabProps['extraTabs'];
  suffixTabs?: SidePanelTabProps['extraTabs'];
  allowToolCalling: boolean;
  assistantMessage?: null | (() => React.JSX.Element);
  userMessage?: null | (() => React.JSX.Element);
  editComposer?: null | (() => React.JSX.Element);
  getCustomSystemPrompt?: () => string;
  customIcon?: React.ReactNode;
  suggestions?: { text: string; prompt: string }[];
  allowChatStorage?: boolean;
  helperTextSet?: {
    title: (props: any) => string;
    description: (props: any) => string;
  };
  exportChatCallback?: (chatData: ChatDataType[], filename: string) => void;
  isOptionsPage?: boolean;
};

function PropProvider({
  children,
  footerNode,
  subHeaderNode,
  prefixTabs,
  suffixTabs,
  allowToolCalling = true,
  assistantMessage,
  userMessage,
  editComposer,
  getCustomSystemPrompt,
  customIcon,
  suggestions,
  helperTextSet,
  allowChatStorage,
  exportChatCallback,
  isOptionsPage,
}: PropProviderProps) {
  const switchToNewThreadRef = useRef<(() => void) | null>(null);
  const triggerExportChatRef = useRef<(() => void) | null>(null);
  const [activeTab, setActiveTab] = useState<string>('');

  const contextValue = useMemo<PropProviderType>(
    () => ({
      state: {
        footerNode,
        subHeaderNode,
        prefixTabs: prefixTabs ?? [],
        suffixTabs: suffixTabs ?? [],
        CustomAssistantMessageComponent: assistantMessage,
        CustomUserMessageComponent: userMessage,
        CustomEditComposerComponent: editComposer,
        allowToolCalling,
        CustomIcon: customIcon,
        suggestions,
        helperTextSet,
        allowChatStorage: allowChatStorage ?? true,
        activeTab,
        isOptionsPage: isOptionsPage ?? false,
      },
      actions: {
        getCustomSystemPrompt: getCustomSystemPrompt ?? (() => ''),
        exportChatCallback: exportChatCallback ?? null,
        switchToNewThreadRef,
        triggerExportChatRef,
        setActiveTab,
      },
    }),
    [
      customIcon,
      footerNode,
      subHeaderNode,
      prefixTabs,
      suffixTabs,
      allowToolCalling,
      suggestions,
      helperTextSet,
      allowChatStorage,
      assistantMessage,
      userMessage,
      editComposer,
      getCustomSystemPrompt,
      exportChatCallback,
      activeTab,
      isOptionsPage,
    ]
  );

  return (
    <PropProviderContext.Provider value={contextValue}>
      {children}
    </PropProviderContext.Provider>
  );
}

export default PropProvider;
