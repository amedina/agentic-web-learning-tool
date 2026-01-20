/**
 * Internal dependencies
 */
import { WorkflowCanvas, ToolsSidebar, ToolsConfigPanel } from './components';

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
