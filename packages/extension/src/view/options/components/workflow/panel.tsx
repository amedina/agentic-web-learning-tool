import { useState } from 'react';

/**
 * Internal dependencies
 */
import { WorkflowCanvas, ToolsSidebar, ToolsConfigPanel } from './components';

function Panel() {
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  return (
    <div className="h-dvh w-dvw flex overflow-hidden bg-slate-100 font-sans text-slate-900 antialiased">
      {/* Left Sidebar: Tools */}
      <div
        className={`relative flex transition-all duration-300 ease-in-out border-r border-slate-200 bg-slate-50 ${
          leftCollapsed ? 'w-20' : 'w-74'
        }`}
      >
        <div
          className={`${
            leftCollapsed ? 'w-20' : 'w-74'
          } h-full shrink-0 flex flex-col overflow-hidden transition-all duration-300`}
        >
          <ToolsSidebar
            collapsed={leftCollapsed}
            onToggle={() => setLeftCollapsed(!leftCollapsed)}
          />
        </div>
      </div>

      {/* Main Canvas Area */}
      <main className="flex-1 min-w-0 h-full relative z-0">
        <WorkflowCanvas />
      </main>

      {/* Right Sidebar: Configuration */}
      <div
        className={`relative flex transition-all duration-300 ease-in-out border-l border-slate-200 bg-white ${
          rightCollapsed ? 'w-14' : 'w-74'
        }`}
      >
        <div
          className={`${rightCollapsed ? 'w-14' : 'w-74'} h-full shrink-0 flex flex-col overflow-hidden transition-all duration-300`}
        >
          <ToolsConfigPanel
            collapsed={rightCollapsed}
            onToggle={() => setRightCollapsed(!rightCollapsed)}
          />
        </div>
      </div>
    </div>
  );
}

export default Panel;
