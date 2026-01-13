/**
 * External dependencies
 */
import { ReactFlowProvider } from "@xyflow/react";
import { initContentScriptBridge } from "@google-awlt/engine-extension";

/**
 * Internal dependencies
 */
import { ApiProvider, FlowProvider } from "./stateProviders";
import Panel from "./panel";

// Initialize the bridge so workflows can run on the Options page itself
initContentScriptBridge();

interface WorkflowProps {
  theme: "light" | "dark" | "system";
}

const Workflow = ({ theme }: WorkflowProps) => {
  return (
    <ApiProvider>
      <FlowProvider>
        <ReactFlowProvider>
          <Panel theme={theme} />
        </ReactFlowProvider>
      </FlowProvider>
    </ApiProvider>
  );
};

export default Workflow;
