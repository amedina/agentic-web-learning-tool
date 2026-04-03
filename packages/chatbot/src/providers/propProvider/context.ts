/**
 * External dependencies
 */
import { createContext } from "@google-awlt/common";
import type { SidePanelTabProps } from "../../../types";

export type PropProviderType = {
  state: {
    footerNode: React.ReactNode;
    extraTabs: SidePanelTabProps["extraTabs"];
    CustomAssistantMessageComponent?: null | (() => React.JSX.Element);
    CustomUserMessageComponent?: null | (() => React.JSX.Element);
    CustomEditComposerComponent?: null | (() => React.JSX.Element);
    allowToolCalling: boolean;
    CustomIcon?: React.ReactNode;
  };
  actions: {
    getCustomSystemPrompt: () => string;
  };
};

const initialState: PropProviderType = {
  state: {
    footerNode: null,
    extraTabs: [],
    CustomAssistantMessageComponent: null,
    CustomUserMessageComponent: null,
    CustomEditComposerComponent: null,
    allowToolCalling: true,
    CustomIcon: null,
  },
  actions: {
    getCustomSystemPrompt: () => "",
  },
};
const PropProviderContext = createContext<PropProviderType>(initialState);

export default PropProviderContext;
