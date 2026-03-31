/**
 * External dependencies
 */
import { StrictMode, useEffect, useState, useMemo } from "react";
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
import { ComparisonTab } from "./components/comparisonTab";
import { calculateScore } from "../../utils/calculateScore";
import { ModelProvider } from "./providers";

// ── Types ────────────────────────────────────────────────────────────────────

type ExtendedMenuItem = MenuItem & {
  component?: React.ReactNode;
  items?: ExtendedMenuItem[];
};

// ── Comparison wrapper (manages its own state) ────────────────────────────────

function ComparisonTabWrapper() {
  const [comparisonBucket, setComparisonBucket] = useState<any[]>([]);

  useEffect(() => {
    chrome.storage.local.get(["comparisonBucket"], (res) => {
      if (res.comparisonBucket) {
        setComparisonBucket(res.comparisonBucket as any[]);
      }
    });

    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: string,
    ) => {
      if (area === "local" && changes.comparisonBucket) {
        setComparisonBucket((changes.comparisonBucket.newValue as any[]) || []);
      }
    };
    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  const handleClearComparison = () => {
    chrome.storage.local.set({ comparisonBucket: [] }, () =>
      setComparisonBucket([]),
    );
  };

  const winnerName = useMemo(() => {
    if (comparisonBucket.length === 0) return null;
    let bestScore = -Infinity;
    let winner = null;
    comparisonBucket.forEach((pkg) => {
      const score = calculateScore(pkg);
      if (score > bestScore) {
        bestScore = score;
        winner = pkg.packageName;
      }
    });
    return winner;
  }, [comparisonBucket]);

  return (
    <ComparisonTab
      comparisonBucket={comparisonBucket}
      handleClearComparison={handleClearComparison}
      winnerName={winnerName}
    />
  );
}

// ── Sidebar header ────────────────────────────────────────────────────────────

function NpmAdvisorHeader() {
  const { sidebarState } = useSidebar(({ state }) => ({
    sidebarState: state.sidebarState,
  }));

  return (
    <div className="flex items-center gap-2">
      <div className={`ml-2 ${sidebarState === "expanded" ? "" : "hidden"}`}>
        <img
          src={chrome.runtime.getURL("icons/icon-128.png")}
          className="h-6 w-6"
          alt="NPM Advisor"
        />
      </div>
      <span
        className={`font-bold text-lg ${sidebarState === "expanded" ? "" : "hidden"}`}
      >
        NPM Advisor
      </span>
    </div>
  );
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
    component: <ComparisonTabWrapper />,
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

  // Handle hash-based navigation (e.g., from popup "View Comparison" link)
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
