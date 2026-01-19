/**
 * Internal dependencies
 */
import WorkflowCanvas from './components/workflowCanvas';
import ToolsSidebar from './components/tools';
import { ToolsConfigPanel } from './components/tools/ui';

function Panel() {
  return (
    <div className="h-dvh w-dvw flex">
      <ToolsSidebar />
      <WorkflowCanvas />
      <ToolsConfigPanel />
    </div>
  );
}

export default Panel;
