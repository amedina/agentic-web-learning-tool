async function main() {
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

  // 3. Search Overlay on npmjs.com
  if (url.includes("npmjs.com")) {
    setupSearchOverlay();

    chrome.storage.local.get(["useAlgoliaSearch"], (result) => {
      const useAlgolia = result.useAlgoliaSearch !== false; // Default to true
      if (!useAlgolia) return;

      // Hide native npm search results overlay and backdrop
      const style = document.createElement("style");
      style.textContent = `
      ._89eb4d40, .e6f92c42, div:has(> ul[role="listbox"][id^="typeahead-list-"]) {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }
    `;
      document.head.appendChild(style);
    });
  }
}

function isDarkMode(): boolean {
  const html = document.documentElement;

  const colorMode = html.getAttribute("data-color-mode");

  if (colorMode === "dark") return true;
  if (colorMode === "light") return false;

  if (html.dataset.colorMode === "dark") {
    return true;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function setupSearchOverlay() {
  const searchInput = document.querySelector(
    'input[aria-label="Search packages"]',
  ) as HTMLInputElement;
  if (!searchInput) return;

  const searchForm = searchInput.closest("form");
  if (!searchForm) return;

  const searchFormParent = searchInput.parentElement;
  if (!searchFormParent) return;

  chrome.storage.local.get(["useAlgoliaSearch"], (result) => {
    const useAlgolia = result.useAlgoliaSearch !== false;
    if (!useAlgolia) return;

    const applyTheme = () => {
      const dark = isDarkMode();

      const bg = "var(--color-bg-default, " + (dark ? "#1a1a1a" : "#fff") + ")";
      const border =
        "var(--color-border-default, " + (dark ? "#3d3d3d" : "#ddd") + ")";
      const inputBg =
        "var(--search-bg-subtle, " + (dark ? "#2d2d2d" : "#fff") + ")";
      const inputText =
        "var(--color-fg-default, " + (dark ? "#e6e6e6" : "#333") + ")";
      const iconColor =
        "var(--color-fg-muted, " + (dark ? "#999" : "#666") + ")";

      Object.assign(overlay.style, {
        backgroundColor: bg,
        border: `1px solid ${border}`,
        boxShadow: dark
          ? "0 4px 12px rgba(0,0,0,0.5)"
          : "0 4px 12px rgba(0,0,0,0.1)",
      });

      Object.assign(customInput.style, {
        backgroundColor: inputBg,
        border: `1px solid ${border}`,
        color: inputText,
      });

      Object.assign(filterMenu.style, {
        backgroundColor: bg,
        border: `1px solid ${border}`,
      });

      if (filterBtn) {
        filterBtn.style.color = iconColor;
      }

      if (overlay.style.display === "block" && lastHits.length > 0) {
        renderHits(overlay, lastHits);
      }
    };

    // Create overlay container
    const overlay = document.createElement("div");
    overlay.id = "npm-advisor-search-overlay";
    Object.assign(overlay.style, {
      position: "absolute",
      top: "100%",
      left: "0",
      right: "0",
      border: "1px solid #ddd",
      borderRadius: "4px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      zIndex: "9999",
      display: "none",
      maxHeight: "400px",
      overflowY: "auto",
      marginTop: "4px",
    });

    searchFormParent.style.position = "relative";
    searchFormParent.appendChild(overlay);

    const customInput = document.createElement("input");
    customInput.type = "text";
    customInput.placeholder = searchInput.placeholder || "Search packages";
    customInput.className = searchInput.className;
    Object.assign(customInput.style, {
      position: "absolute",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      paddingRight: "40px",
      zIndex: "5",
      border: "1px solid #ddd",
      borderRadius: "4px",
      boxSizing: "border-box",
    });

    Object.assign(searchInput.style, {
      opacity: "0",
      pointerEvents: "none",
    });

    searchFormParent.appendChild(customInput);

    const filterMenu = document.createElement("div");
    Object.assign(filterMenu.style, {
      position: "absolute",
      top: "100%",
      right: "0",
      border: "1px solid #ddd",
      borderRadius: "4px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
      zIndex: "10000",
      display: "none",
      padding: "10px",
      marginTop: "8px",
      minWidth: "180px",
    });
    searchFormParent.appendChild(filterMenu);

    const filterBtn = document.createElement("button");
    filterBtn.type = "button";
    filterBtn.innerHTML =
      '<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>';
    Object.assign(filterBtn.style, {
      position: "absolute",
      right: "12px",
      top: "50%",
      transform: "translateY(-50%)",
      background: "none",
      border: "none",
      outline: "none",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "0",
      zIndex: "10",
      transition: "all 0.2s ease-in-out",
    });

    filterBtn.onmouseover = () => {
      filterBtn.style.color = "#fb823e";
      filterBtn.style.transform = "translateY(-50%) scale(1.1)";
    };

    filterBtn.onmouseout = () => {
      filterBtn.style.color = isDarkMode() ? "#999" : "#666";
      filterBtn.style.transform = "translateY(-50%) scale(1)";
    };

    searchFormParent.appendChild(filterBtn);

    applyTheme();

    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", applyTheme);

    const themeObserver = new MutationObserver(applyTheme);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      subtree: true,
      attributeFilter: ["class", "data-color-mode", "data-theme-setting"],
    });

    let lastHits: any[] = [];
    let activeIndex = -1;
    let currentPage = 0;
    let nbPages = 0;
    let isFetchingMore = false;
    let activeFilterMode: { label: string; key: string } | null = null;

    const chipsContainer = document.createElement("div");
    chipsContainer.id = "npm-advisor-filter-chips";
    Object.assign(chipsContainer.style, {
      display: "flex",
      flexWrap: "wrap",
      gap: "6px",
      marginBottom: "4px",
      padding: "0 4px",
      width: "100%",
    });

    if (searchForm.parentElement) {
      searchForm.parentElement.insertBefore(chipsContainer, searchForm);
    }

    function updateSearch() {
      const inputVal = customInput.value;
      if (!inputVal.trim() && !activeFilterMode) {
        overlay.style.display = "none";
        lastHits = [];
        activeIndex = -1;
        return;
      }

      const query = inputVal;
      const facetFilters = activeFilterMode
        ? [`${activeFilterMode.key}:${inputVal}`]
        : [];

      isFetchingMore = true;

      chrome.runtime.sendMessage(
        { type: "SEARCH_NPM", query, facetFilters, page: currentPage },
        (response) => {
          isFetchingMore = false;
          if (response && response.success) {
            currentPage = response.page;
            nbPages = response.nbPages;
            lastHits = [...lastHits, ...response.hits];
            renderHits(overlay, lastHits, activeIndex);
          }
        },
      );
    }

    function renderChips() {
      chipsContainer.innerHTML = "";
      if (!activeFilterMode) return;

      const chip = document.createElement("div");
      Object.assign(chip.style, {
        backgroundColor: "#fb823e15",
        color: "#fb823e",
        padding: "3px 8px",
        borderRadius: "16px",
        fontSize: "10px",
        fontWeight: "600",
        display: "flex",
        alignItems: "center",
        border: "1px solid #fb823e30",
        boxShadow: "0 1px 2px rgba(251,130,62,0.1)",
      });
      chip.textContent = `Mode: ${activeFilterMode.label}`;

      const remove = document.createElement("span");
      remove.innerHTML = "&times;";
      Object.assign(remove.style, {
        marginLeft: "6px",
        cursor: "pointer",
        fontSize: "12px",
        lineHeight: "1",
        opacity: "0.7",
      });

      remove.onclick = () => {
        activeFilterMode = null;
        renderChips();
        updateSearch();
      };

      chip.appendChild(remove);
      chipsContainer.appendChild(chip);
    }

    filterBtn.onclick = (e) => {
      e.stopPropagation();
      const isVisible = filterMenu.style.display === "block";
      filterMenu.style.display = isVisible ? "none" : "block";

      const dark = isDarkMode();
      const staticModes = [
        { label: "Owner", key: "owner.name" },
        { label: "Keyword", key: "keywords" },
      ];

      filterMenu.innerHTML = `<div style="font-weight:bold; margin-bottom:8px; font-size:11px; color:#999; letter-spacing:0.05em; text-transform:uppercase;">Search Modes</div>`;

      staticModes.forEach((m) => {
        const opt = document.createElement("div");
        opt.textContent = `Filter by ${m.label}`;
        const isActive = activeFilterMode?.key === m.key;

        Object.assign(opt.style, {
          padding: "8px",
          cursor: "pointer",
          fontSize: "13px",
          borderRadius: "4px",
          transition: "background-color 0.2s",
          backgroundColor: isActive ? "#fb823e10" : "transparent",
          color: isActive ? "#fb823e" : dark ? "#e6e6e6" : "#333",
          fontWeight: isActive ? "600" : "400",
        });

        opt.onmouseover = () =>
          (opt.style.backgroundColor = isActive
            ? "#fb823e15"
            : dark
              ? "#242424"
              : "#f8f8f8");

        opt.onmouseout = () =>
          (opt.style.backgroundColor = isActive ? "#fb823e10" : "transparent");

        opt.onclick = () => {
          activeFilterMode = m;
          renderChips();
          updateSearch();
          filterMenu.style.display = "none";
        };

        filterMenu.appendChild(opt);
      });
    };

    let debounceTimer: any;
    customInput.addEventListener("input", () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(updateSearch, 200);
    });

    customInput.addEventListener("focus", () => {
      if (!chrome.runtime?.id) {
        alert(
          "NPM Advisor extension was updated. The page will now reload to apply the latest changes.",
        );
        window.location.reload();
      }
    });

    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const query = customInput.value.trim();
      if (query) {
        window.location.href = `https://www.npmjs.com/search?q=${encodeURIComponent(query)}`;
      }
    });

    customInput.addEventListener("keydown", (e) => {
      if (overlay.style.display === "none" && e.key !== "Enter") return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        activeIndex = Math.min(activeIndex + 1, lastHits.length - 1);

        renderHits(overlay, lastHits, activeIndex);
        scrollActiveIntoView();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        activeIndex = Math.max(activeIndex - 1, -1);

        renderHits(overlay, lastHits, activeIndex);
        scrollActiveIntoView();
      } else if (e.key === "Enter") {
        e.preventDefault();

        const activeItem = overlay.children[activeIndex] as HTMLElement;
        if (activeItem) {
          activeItem.click();
        } else {
          window.location.href = `https://www.npmjs.com/search?q=${encodeURIComponent(customInput.value.trim())}`;
        }
      }
    });

    function scrollActiveIntoView() {
      if (activeIndex < 0) return;
      const activeItem = overlay.children[activeIndex] as HTMLElement;

      if (!activeItem) return;

      const overlayRect = overlay.getBoundingClientRect();
      const itemRect = activeItem.getBoundingClientRect();

      if (itemRect.bottom > overlayRect.bottom) {
        overlay.scrollTop += itemRect.bottom - overlayRect.bottom;
      } else if (itemRect.top < overlayRect.top) {
        overlay.scrollTop -= overlayRect.top - itemRect.top;
      }
    }

    overlay.addEventListener("scroll", () => {
      if (isFetchingMore || currentPage >= nbPages - 1) return;

      const threshold = 50;
      if (
        overlay.scrollHeight - overlay.scrollTop - overlay.clientHeight <
        threshold
      ) {
        currentPage++;
        updateSearch();
      }
    });

    document.addEventListener("click", (e) => {
      if (!searchForm.contains(e.target as Node)) {
        overlay.style.display = "none";
        filterMenu.style.display = "none";
      }
    });
  });
}

function renderHits(
  overlay: HTMLElement,
  hits: any[],
  activeIndex: number = -1,
) {
  overlay.innerHTML = "";
  if (hits.length === 0) {
    overlay.style.display = "none";
    return;
  }

  overlay.style.display = "block";
  const dark = isDarkMode();

  hits.forEach((hit, index) => {
    const item = document.createElement("div");
    const isActive = index === activeIndex;

    const baseBg =
      "var(--color-bg-default, " + (dark ? "#1a1a1a" : "#fff") + ")";
    const hoverBg =
      "var(--color-bg-subtle, " + (dark ? "#242424" : "#f8f8f8") + ")";
    const activeBg = dark ? "#fb823e25" : "#fb823e10";
    const borderColor =
      "var(--color-border-muted, " + (dark ? "#3d3d3d" : "#eee") + ")";
    const accentColor = "#fb823e";

    Object.assign(item.style, {
      padding: "10px",
      borderBottom: `1px solid ${borderColor}`,
      borderLeft: isActive
        ? `3px solid ${accentColor}`
        : "3px solid transparent",
      cursor: "pointer",
      transition: "all 0.2s",
      backgroundColor: isActive ? activeBg : baseBg,
    });

    item.onmouseover = () => {
      if (!isActive) item.style.backgroundColor = hoverBg;
    };
    item.onmouseout = () => {
      if (!isActive) item.style.backgroundColor = baseBg;
    };

    const name = document.createElement("div");
    name.textContent = hit.name;
    Object.assign(name.style, {
      fontWeight: isActive ? "800" : "bold",
      color: isActive
        ? accentColor
        : "var(--color-fg-default, " + (dark ? "#e6e6e6" : "#333") + ")",
    });

    const desc = document.createElement("div");
    desc.textContent = hit.description;
    Object.assign(desc.style, {
      fontSize: "12px",
      color: "var(--color-fg-muted, " + (dark ? "#999" : "#666") + ")",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      fontWeight: isActive ? "500" : "normal",
    });

    item.appendChild(name);
    item.appendChild(desc);

    item.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.location.href = `https://www.npmjs.com/package/${hit.name}`;
    });

    overlay.appendChild(item);
  });
}

function init() {
  console.log("[NPM Advisor] Content script initialized.");
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
