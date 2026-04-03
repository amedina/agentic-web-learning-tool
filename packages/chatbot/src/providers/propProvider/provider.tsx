/**
 * External dependencies
 */
import { useMemo, type PropsWithChildren } from "react";
/**
 * Internal dependencies
 */
import PropProviderContext, { type PropProviderType } from "./context";
import type { SidePanelTabProps } from "../../../types";

type PropProviderProps = PropsWithChildren & {
  footerNode: React.ReactNode;
  extraTabs: SidePanelTabProps["extraTabs"];
  allowToolCalling: boolean;
  assistantMessage?: null | (() => React.JSX.Element);
  userMessage?: null | (() => React.JSX.Element);
  editComposer?: null | (() => React.JSX.Element);
  getCustomSystemPrompt?: () => string;
  customIcon?: React.ReactNode;
};

function PropProvider({
  children,
  footerNode,
  extraTabs,
  allowToolCalling = true,
  assistantMessage,
  userMessage,
  editComposer,
  getCustomSystemPrompt,
  customIcon,
}: PropProviderProps) {
  const contextValue = useMemo<PropProviderType>(
    () => ({
      state: {
        footerNode,
        extraTabs,
        CustomAssistantMessageComponent: assistantMessage,
        CustomUserMessageComponent: userMessage,
        CustomEditComposerComponent: editComposer,
        allowToolCalling,
        CustomIcon: customIcon,
      },
      actions: {
        getCustomSystemPrompt: getCustomSystemPrompt ?? (() => ""),
      },
    }),
    [
      customIcon,
      footerNode,
      extraTabs,
      allowToolCalling,
      assistantMessage,
      userMessage,
      editComposer,
      getCustomSystemPrompt,
    ],
  );

  return (
    <PropProviderContext.Provider value={contextValue}>
      {children}
    </PropProviderContext.Provider>
  );
}

export default PropProvider;
