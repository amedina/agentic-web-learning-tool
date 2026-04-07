/**
 * External dependencies
 */
import { useMemo, type PropsWithChildren } from 'react';
/**
 * Internal dependencies
 */
import PropProviderContext, { type PropProviderType } from './context';
import type { SidePanelTabProps } from '../../../types';

type PropProviderProps = PropsWithChildren & {
  footerNode: React.ReactNode;
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
};

function PropProvider({
  children,
  footerNode,
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
}: PropProviderProps) {
  const contextValue = useMemo<PropProviderType>(
    () => ({
      state: {
        footerNode,
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
      },
      actions: {
        getCustomSystemPrompt: getCustomSystemPrompt ?? (() => ''),
      },
    }),
    [
      customIcon,
      footerNode,
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
    ]
  );

  return (
    <PropProviderContext.Provider value={contextValue}>
      {children}
    </PropProviderContext.Provider>
  );
}

export default PropProvider;
