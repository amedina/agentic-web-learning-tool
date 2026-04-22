/**
 * External dependencies
 */
import { createRoot } from "react-dom/client";

/**
 * Internal dependencies
 */
import { SearchBar } from "./views/searchBar";
import { SearchResults } from "./views/searchResults";

// Vite inlines the Tailwind CSS as a string so it can be injected into the Shadow DOM
import contentStyles from "./contentScript.css?inline";

// Shim `process` for libraries that expect it in the global scope (e.g. React in dev mode).
// `process.env.NODE_ENV` is replaced at build time by Vite's define, so this correctly
// resolves to "development" or "production" depending on the build.
// @ts-ignore
if (typeof window.process === "undefined") {
  // @ts-ignore
  window.process = { env: { NODE_ENV: process.env.NODE_ENV } };
}

/**
 * Main controller for the NPM Advisor content script.
 * Detects the current page context, triggers data prefetching,
 * and mounts the React overlay and search results apps into Shadow DOM.
 */
const npmAdvisor = {
  /**
   * Waits for the DOM to be ready, then calls run().
   */
  init() {
    console.log(
      "[NPM Advisor] Content script initialized (React Mode with Shadow DOM).",
    );
    if (
      document.readyState === "complete" ||
      document.readyState === "interactive"
    ) {
      this.run().catch(console.error);
    } else {
      window.addEventListener("load", () => {
        this.run().catch(console.error);
      });
    }
  },

  /**
   * Detects the page type, prefetches package data, and bootstraps the appropriate UI.
   */
  async run() {
    const url = window.location.href;
    let packageName: string | null = null;

    // 1. Detect if on npmjs.com package page
    if (url.includes("npmjs.com/package/")) {
      const match = url.match(/npmjs\.com\/package\/([^?#]+)/);
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

    // 3. NPM Search Takeover (respects the useAlgoliaSearch opt-out flag)
    if (url.includes("npmjs.com")) {
      chrome.storage.local.get(["useAlgoliaSearch"], (result) => {
        const useAlgolia = result.useAlgoliaSearch !== false;
        if (!useAlgolia) return;

        this.initSearchExperience();

        if (url.includes("npmjs.com/search")) {
          this.initFullPageSearch();
        }
      });
    }
  },

  /**
   * Creates a Shadow Root and injects the bundled Tailwind CSS into it.
   */
  createShadowRoot(hostId: string) {
    const host = document.createElement("div");
    host.id = hostId;

    const shadow = host.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = contentStyles;
    shadow.appendChild(style);

    return { host, shadow };
  },

  /**
   * Replaces the native npm search input with the React overlay and suppresses native dropdowns.
   */
  initSearchExperience() {
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

    if (!document.getElementById("npm-advisor-overlay-host")) {
      const { host, shadow } = this.createShadowRoot(
        "npm-advisor-overlay-host",
      );
      host.style.position = "absolute";
      host.style.top = "0";
      host.style.left = "0";
      host.style.width = "100%";
      host.style.height = "100%";
      host.style.zIndex = "10";

      searchForm.style.position = "relative";
      searchForm.appendChild(host);

      const container = document.createElement("div");
      container.style.width = "100%";
      container.style.height = "100%";
      container.id = "npm-advisor-overlay-root";
      shadow.appendChild(container);

      createRoot(container).render(<SearchBar />);
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
      form:has(#npm-advisor-overlay-host) button[type="submit"] {
        opacity: 0 !important;
        pointer-events: none !important;
      }
    `;
    document.head.appendChild(style);
  },

  /**
   * Clears the native search results page and mounts the React results app in its place.
   */
  mountResultsApp(mainEl: Element) {
    mainEl.innerHTML = "";

    const { host, shadow } = this.createShadowRoot("npm-advisor-results-host");
    host.style.width = "100%";
    host.style.minHeight = "100vh";
    mainEl.appendChild(host);

    const container = document.createElement("div");
    container.id = "npm-advisor-results-root";
    shadow.appendChild(container);

    createRoot(container).render(<SearchResults />);
  },

  /**
   * Mounts the full-page results app, waiting via MutationObserver if <main> isn't in the DOM yet.
   */
  initFullPageSearch() {
    const main = document.querySelector("main");
    if (main) {
      if (!document.getElementById("npm-advisor-results-host")) {
        this.mountResultsApp(main);
      }
      return;
    }

    // `main` isn't in the DOM yet — observe until it appears
    const observer = new MutationObserver(() => {
      const mainEl = document.querySelector("main");
      if (mainEl && !document.getElementById("npm-advisor-results-host")) {
        observer.disconnect();
        this.mountResultsApp(mainEl);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  },
};

npmAdvisor.init();
