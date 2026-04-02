/**
 * Internal dependencies
 */
import "./index.css";
import SidePanel from "./chatWrapper";
import { ModelProvider, TabThreadInformationProvider } from "./providers";
import type { SidePanelTabProps } from "../types";

export const SidepanelChatbot = ({
  extraTabs,
  footerNode,
}: SidePanelTabProps) => {
  return (
    <ModelProvider>
      <TabThreadInformationProvider>
        <SidePanel extraTabs={extraTabs} footerNode={footerNode} />
      </TabThreadInformationProvider>
    </ModelProvider>
  );
};
