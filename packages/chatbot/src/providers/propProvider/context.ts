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
    suggestions?: { text: string; prompt: string }[];
    helperTextSet?: { title: string; description: string };
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
    suggestions: [],
    helperTextSet: { title: "", description: "" },
  },
  actions: {
    getCustomSystemPrompt: () => "",
  },
};
const PropProviderContext = createContext<PropProviderType>(initialState);

export default PropProviderContext;
