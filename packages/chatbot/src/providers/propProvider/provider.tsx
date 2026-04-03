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
  assistantMessage?: null | (() => React.JSX.Element);
  userMessage?: null | (() => React.JSX.Element);
  editComposer?: null | (() => React.JSX.Element);
};

function PropProvider({
  children,
  footerNode,
  extraTabs,
  assistantMessage,
  userMessage,
  editComposer,
}: PropProviderProps) {
  const contextValue = useMemo<PropProviderType>(
    () => ({
      state: {
        footerNode,
        extraTabs,
        CustomAssistantMessageComponent: assistantMessage,
        CustomUserMessageComponent: userMessage,
        CustomEditComposerComponent: editComposer,
      },
      actions: {},
    }),
    [footerNode, extraTabs, assistantMessage, userMessage, editComposer],
  );

  return (
    <PropProviderContext.Provider value={contextValue}>
      {children}
    </PropProviderContext.Provider>
  );
}

export default PropProvider;
