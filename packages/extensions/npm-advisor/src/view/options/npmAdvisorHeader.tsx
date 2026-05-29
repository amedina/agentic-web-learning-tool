/**
 * External dependencies.
 */
import { useSidebar } from "@agentic-web-labs/design-system";

/**
 * Sidebar header for the Options page: the NPM Advisor icon and wordmark.
 * Collapses the label to zero width when the sidebar is in icon-only mode.
 */
export function NpmAdvisorHeader() {
  const { sidebarState } = useSidebar(({ state }) => ({
    sidebarState: state.sidebarState,
  }));

  const expanded = sidebarState === "expanded";

  return (
    <div className="flex items-center gap-2 overflow-hidden">
      <div
        className={`ml-2 shrink-0 transition-all duration-200 ${expanded ? "opacity-100 w-6" : "opacity-0 w-0"}`}
      >
        <img
          src={chrome.runtime.getURL("icons/icon-128.png")}
          className="h-6 w-6"
          alt="NPM Advisor"
        />
      </div>
      <span
        className={`font-bold text-lg whitespace-nowrap overflow-hidden transition-all duration-200 ${expanded ? "opacity-100 max-w-xs" : "opacity-0 max-w-0"}`}
      >
        NPM Advisor
      </span>
    </div>
  );
}
