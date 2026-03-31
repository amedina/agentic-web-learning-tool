/**
 * External dependencies
 */
import { StrictMode, useEffect, useMemo } from "react";
import { createRoot } from "react-dom/client";
import {
  Sidebar,
  SidebarProvider,
  SidebarTrigger,
  Toaster,
  useSidebar,
  type MenuItem,
} from "@google-awlt/design-system";
import { CpuIcon, Settings2, BarChart2 } from "lucide-react";

/**
 * Internal dependencies
 */
import "./options.css";
import ModelsTab from "./components/models";
import SettingsTab from "./components/settings";
import ComparisonPage from "./components/comparison";
import { ModelProvider } from "./providers";

// ── Types ────────────────────────────────────────────────────────────────────

type ExtendedMenuItem = MenuItem & {
  component?: React.ReactNode;
  items?: ExtendedMenuItem[];
};

// ── Sidebar header ────────────────────────────────────────────────────────────

function NpmAdvisorHeader() {
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

// ── Apply theme on load ───────────────────────────────────────────────────────

function applyTheme() {
  chrome.storage.local.get(["npmAdvisorDarkMode"], (res) => {
    if (res.npmAdvisorDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  });
}

// ── Menu items ────────────────────────────────────────────────────────────────

const Items: ExtendedMenuItem[] = [
  {
    title: "Models",
    id: "models",
    icon: () => <CpuIcon />,
    component: <ModelsTab />,
    isDisabled: false,
  },
  {
    title: "Compare",
    id: "comparison",
    icon: () => <BarChart2 />,
    component: <ComparisonPage />,
    isDisabled: false,
  },
];

const FooterItems: ExtendedMenuItem[] = [
  {
    title: "Settings",
    id: "settings",
    icon: () => <Settings2 />,
    component: <SettingsTab />,
  },
];

// ── Main Options component ────────────────────────────────────────────────────

function Options() {
  const { selectedMenuItem, setSelectedMenuItem } = useSidebar(
    ({ state, actions }) => ({
      selectedMenuItem: state.selectedMenuItem,
      setSelectedMenuItem: actions.setSelectedMenuItem,
    }),
  );

  const flatItems = useMemo(() => {
    const flatten = (items: ExtendedMenuItem[]): ExtendedMenuItem[] =>
      items.reduce((acc: ExtendedMenuItem[], item) => {
        acc.push(item);
        if (item.items) acc.push(...flatten(item.items));
        return acc;
      }, []);
    return [...flatten(Items), ...flatten(FooterItems)];
  }, []);

  useEffect(() => {
    const isValidSelection = flatItems.some(
      (item) => item.id === selectedMenuItem,
    );
    if (!selectedMenuItem || !isValidSelection) {
      const defaultItem = flatItems.find((item) => item.component);
      if (defaultItem) setSelectedMenuItem(defaultItem.id);
    }
  }, [selectedMenuItem, flatItems, setSelectedMenuItem]);

  // Hash-based navigation (e.g., popup "View Comparison" link)
  useEffect(() => {
    if (window.location.hash === "#comparison") {
      setSelectedMenuItem("comparison");
    }
    const onHashChange = () => {
      if (window.location.hash === "#comparison") {
        setSelectedMenuItem("comparison");
      }
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [setSelectedMenuItem]);

  // Keep theme in sync with popup toggle
  useEffect(() => {
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: string,
    ) => {
      if (area === "local" && changes.npmAdvisorDarkMode !== undefined) {
        if (changes.npmAdvisorDarkMode.newValue) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    };
    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  return (
    <>
      <Toaster position="top-center" />
      <div className="fixed top-0 left-0 z-20 md:hidden pl-4 shadow bg-sidebar rounded-md">
        <SidebarTrigger />
      </div>
      <Sidebar
        items={Items}
        footerItems={FooterItems}
        collapsible="icon"
        header={<NpmAdvisorHeader />}
      />
      {flatItems.find((item) => item.id === selectedMenuItem)?.component}
    </>
  );
}

// ── Entry point ───────────────────────────────────────────────────────────────

const container = document.getElementById("root");
if (container) {
  applyTheme();
  createRoot(container).render(
    <StrictMode>
      <div className="w-screen h-screen">
        <ModelProvider>
          <SidebarProvider defaultSelectedMenuItem="models">
            <Options />
          </SidebarProvider>
        </ModelProvider>
      </div>
    </StrictMode>,
  );
}
