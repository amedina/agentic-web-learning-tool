/**
 * External dependencies
 */
import { createContext } from '@google-awlt/common';
import type { RefObject } from 'react';
/**
 * Internal dependencies
 */
import type { SidePanelTabProps } from '../../../types';
import type { ChatDataType } from '../../customRuntime/types';

export type PropProviderType = {
  state: {
    footerNode: React.ReactNode;
    subHeaderNode?: React.ReactNode;
    prefixTabs: SidePanelTabProps['extraTabs'];
    suffixTabs: SidePanelTabProps['extraTabs'];
    CustomAssistantMessageComponent?: null | (() => React.JSX.Element);
    CustomUserMessageComponent?: null | (() => React.JSX.Element);
    CustomEditComposerComponent?: null | (() => React.JSX.Element);
    allowToolCalling: boolean;
    CustomIcon?: React.ReactNode;
    suggestions?: { text: string; prompt: string }[];
    helperTextSet?: {
      title: (props?: any) => string;
      description: (props?: any) => string;
    };
    allowChatStorage: boolean;
    activeTab: string;
  };
  actions: {
    getCustomSystemPrompt: () => string;
    exportChatCallback:
      | ((chatData: ChatDataType[], filename: string) => void)
      | null;
    switchToNewThreadRef: RefObject<(() => void) | null>;
    triggerExportChatRef: RefObject<(() => void) | null>;
    setActiveTab: (tab: string) => void;
  };
};

const initialState: PropProviderType = {
  state: {
    footerNode: null,
    subHeaderNode: null,
    prefixTabs: [],
    suffixTabs: [],
    CustomAssistantMessageComponent: null,
    CustomUserMessageComponent: null,
    CustomEditComposerComponent: null,
    allowToolCalling: true,
    CustomIcon: null,
    suggestions: [],
    helperTextSet: {
      title: () => '',
      description: () => '',
    },
    allowChatStorage: true,
    activeTab: '',
  },
  actions: {
    getCustomSystemPrompt: () => '',
    exportChatCallback: null,
    switchToNewThreadRef: { current: null },
    triggerExportChatRef: { current: null },
    setActiveTab: () => {},
  },
};
const PropProviderContext = createContext<PropProviderType>(initialState);

export default PropProviderContext;
