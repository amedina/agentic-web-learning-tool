/**
 * External dependencies
 */
import { createContext } from '@google-awlt/common';
/**
 * Internal dependencies
 */
import type { SidePanelTabProps } from '../../../types';
import type { ChatDataType } from '../../customRuntime/types';

export type PropProviderType = {
  state: {
    footerNode: React.ReactNode;
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
  };
  actions: {
    getCustomSystemPrompt: () => string;
    exportChatCallback:
      | ((chatData: ChatDataType[], filename: string) => void)
      | null;
  };
};

const initialState: PropProviderType = {
  state: {
    footerNode: null,
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
  },
  actions: {
    getCustomSystemPrompt: () => '',
    exportChatCallback: null,
  },
};
const PropProviderContext = createContext<PropProviderType>(initialState);

export default PropProviderContext;
