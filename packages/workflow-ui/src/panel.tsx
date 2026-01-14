import { useState } from "react";

/**
 * Internal dependencies
 */
import { Flow, ToolsBar, ToolsConfig } from "./components";

interface PanelProps {
  theme: "light" | "dark" | "system";
  workflowId: string | null;
  setWorkflowId: (id: string | null) => void;
}

function Panel({ theme, workflowId, setWorkflowId }: PanelProps) {
  const [leftCollapsed, setLeftCollapsed] = useState(() => {
    const saved = localStorage.getItem("awl_wc_left_collapsed");
    return saved === "true";
  });
  const [rightCollapsed, setRightCollapsed] = useState(() => {
    const saved = localStorage.getItem("awl_wc_right_collapsed");
    return saved === "true";
  });

  const toggleLeft = () => {
    const newState = !leftCollapsed;
    setLeftCollapsed(newState);
    localStorage.setItem("awl_wc_left_collapsed", String(newState));
  };

  const toggleRight = () => {
    const newState = !rightCollapsed;
    setRightCollapsed(newState);
    localStorage.setItem("awl_wc_right_collapsed", String(newState));
  };

  return (
    <div className="h-dvh w-dvw flex overflow-hidden bg-slate-100 dark:bg-background font-sans text-slate-900 dark:text-foreground antialiased">
      {/* Left Sidebar: Tools */}
      <div
        className={`relative flex transition-all duration-300 ease-in-out border-r border-slate-200 dark:border-border bg-slate-50 dark:bg-zinc-900 ${
          leftCollapsed ? "w-20" : "w-65"
        }`}
      >
        <div className="h-full w-full flex flex-col overflow-hidden transition-all duration-300">
          <ToolsBar collapsed={leftCollapsed} onToggle={toggleLeft} />
        </div>
      </div>

      {/* Main Canvas Area */}
      <main className="flex-1 min-w-0 h-full relative z-0">
        <Flow
          theme={theme}
          workflowId={workflowId}
          setWorkflowId={setWorkflowId}
        />
      </main>

      {/* Right Sidebar: Configuration */}
      <div
        className={`relative flex transition-all duration-300 ease-in-out border-l border-slate-200 dark:border-border bg-white dark:bg-zinc-900 ${
          rightCollapsed ? "w-14" : "w-74"
        }`}
      >
        <div
          className={`${rightCollapsed ? "w-14" : "w-74"} h-full shrink-0 flex flex-col overflow-hidden transition-all duration-300`}
        >
          <ToolsConfig collapsed={rightCollapsed} onToggle={toggleRight} />
        </div>
      </div>
    </div>
  );
}

export default Panel;
