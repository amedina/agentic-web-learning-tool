// Shim process for libraries that expect it in the global scope (e.g. React in dev mode)
// @ts-ignore
if (typeof window.process === "undefined") {
  // @ts-ignore
  window.process = { env: { NODE_ENV: "development" } };
}

import { createRoot } from "react-dom/client";
import { SearchOverlayApp } from "./apps/SearchOverlayApp";
import { SearchResultsApp } from "./apps/SearchResultsApp";

// Import CSS as a string using Vite's ?inline suffix
import contentStyles from "./contentScript.css?inline";

async function main() {
  const url = window.location.href;
  let packageName: string | null = null;

  // 1. Detect if on npmjs.com package page
  if (url.includes("npmjs.com/package/")) {
    const match = url.match(/npmjs\.com\/package\/([^/?#]+)/);
    if (match && match[1]) {
      packageName = decodeURIComponent(match[1]);
    }
  }
  // 2. Detect if on Github package.json page
  else if (
    url.includes("github.com") &&
    url.endsWith("package.json") &&
    url.includes("/blob/")
  ) {
    const rawUrl = url.replace("/blob/", "/raw/");
    try {
      const response = await fetch(rawUrl);
      if (response.ok) {
        const pkg = await response.json();
        if (pkg && pkg.name) {
          packageName = pkg.name;
        }
      }
    } catch (e) {
      console.error(
        "[NPM Advisor] Failed to parse package.json from github URL",
        e,
      );
    }
  }

  if (packageName) {
    chrome.runtime.sendMessage({ type: "PREFETCH", packageName });
  }

  // 3. NPM Search Takeover
  if (url.includes("npmjs.com")) {
    initSearchExperience();

    if (url.includes("npmjs.com/search")) {
      initFullPageSearch();
    }
  }
}

/**
 * Creates a Shadow Root and handles CSS injection.
 */
function createShadowRoot(hostId: string) {
  const host = document.createElement("div");
  host.id = hostId;

  // Attach shadow root
  const shadow = host.attachShadow({ mode: "open" });

  // Inject the inlined tailwind CSS directly into a style tag
  const style = document.createElement("style");
  style.textContent = contentStyles;
  shadow.appendChild(style);

  return { host, shadow };
}

function initSearchExperience() {
  const searchInput = document.querySelector(
    'input[aria-label="Search packages"]',
  ) as HTMLInputElement;

  if (!searchInput) return;

  const searchForm = searchInput.closest("form");
  if (!searchForm) return;

  const searchFormParent = searchInput.parentElement;
  if (!searchFormParent) return;

  // Hide native input
  searchInput.style.opacity = "0";
  searchInput.style.pointerEvents = "none";
  searchFormParent.style.position = "relative";

  // Create Root for React Overlay if not exists
  if (!document.getElementById("npm-advisor-overlay-host")) {
    const { host, shadow } = createShadowRoot("npm-advisor-overlay-host");
    host.style.position = "absolute";
    host.style.top = "0";
    host.style.left = "0";
    host.style.width = "100%";
    host.style.height = "100%";
    host.style.zIndex = "10";

    searchFormParent.appendChild(host);

    const container = document.createElement("div");
    container.style.width = "100%";
    container.style.height = "100%";
    container.id = "npm-advisor-overlay-root";
    shadow.appendChild(container);

    const root = createRoot(container);
    root.render(<SearchOverlayApp />);
  }

  // Hide native dropdowns/backdrops
  const style = document.createElement("style");
  style.id = "npm-advisor-native-hide-styles";
  style.textContent = `
    ._89eb4d40, .e6f92c42, div:has(> ul[role="listbox"][id^="typeahead-list-"]) {
      display: none !important;
      visibility: hidden !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }
  `;
  document.head.appendChild(style);
}

function initFullPageSearch() {
  const findMain = () => {
    const main = document.querySelector("main");
    if (main) {
      if (document.getElementById("npm-advisor-results-host")) return;

      // Clear main content
      main.innerHTML = "";

      const { host, shadow } = createShadowRoot("npm-advisor-results-host");
      host.style.width = "100%";
      host.style.minHeight = "100vh";
      main.appendChild(host);

      const container = document.createElement("div");
      container.id = "npm-advisor-results-root";
      shadow.appendChild(container);

      const root = createRoot(container);
      root.render(<SearchResultsApp />);
    } else {
      setTimeout(findMain, 100);
    }
  };

  findMain();
}

function init() {
  console.log(
    "[NPM Advisor] Content script initialized (React Mode with Shadow DOM).",
  );
  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    main().catch(console.error);
  } else {
    window.addEventListener("load", () => {
      main().catch(console.error);
    });
  }
}

init();
