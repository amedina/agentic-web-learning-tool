/**
 * Internal dependencies
 */
import "./index.css";
import SidePanel from "./chatWrapper";
import { ModelProvider, TabThreadInformationProvider } from "./providers";

export const SidepanelChatbot = () => {
  return (
    <ModelProvider>
      <TabThreadInformationProvider>
        <SidePanel />
      </TabThreadInformationProvider>
    </ModelProvider>
  );
};
