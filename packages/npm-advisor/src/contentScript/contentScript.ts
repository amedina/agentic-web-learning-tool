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
    const useAlgolia = result.useAlgoliaSearch !== false; // Default to true
    if (!useAlgolia) return;

    // Create overlay container
    const overlay = document.createElement("div");
    overlay.id = "npm-advisor-search-overlay";
    Object.assign(overlay.style, {
      position: "absolute",
      top: "100%",
      left: "0",
      right: "0",
      backgroundColor: "#fff",
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
      backgroundColor: "#fff",
      border: "1px solid #ddd",
      borderRadius: "4px",
      boxSizing: "border-box",
    });

    Object.assign(searchInput.style, {
      opacity: "0",
      pointerEvents: "none",
    });

    searchFormParent.appendChild(customInput);

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
      color: "#666",
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
      filterBtn.style.color = "#666";
      filterBtn.style.transform = "translateY(-50%) scale(1)";
    };

    searchFormParent.appendChild(filterBtn);

    const filterMenu = document.createElement("div");
    Object.assign(filterMenu.style, {
      position: "absolute",
      top: "100%",
      right: "0",
      backgroundColor: "#fff",
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

    function updateSearch() {
      const inputVal = customInput.value;
      if (!inputVal.trim() && !activeFilterMode) {
        overlay.style.display = "none";
        return;
      }

      const query = inputVal;
      const facetFilters = activeFilterMode
        ? [`${activeFilterMode.key}:${inputVal}`]
        : [];

      chrome.runtime.sendMessage(
        { type: "SEARCH_NPM", query, facetFilters },
        (response) => {
          if (response && response.success) {
            renderHits(overlay, response.hits);
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

      const staticModes = [
        { label: "Owner", key: "owner.name" },
        { label: "Keyword", key: "keywords" },
      ];

      filterMenu.innerHTML =
        '<div style="font-weight:bold; margin-bottom:8px; font-size:11px; color:#999; letter-spacing:0.05em; text-transform:uppercase;">Search Modes</div>';

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
          color: isActive ? "#fb823e" : "#333",
          fontWeight: isActive ? "600" : "400",
        });

        opt.onmouseover = () =>
          (opt.style.backgroundColor = isActive ? "#fb823e15" : "#f8f8f8");
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

    document.addEventListener("click", (e) => {
      if (!searchForm.contains(e.target as Node)) {
        overlay.style.display = "none";
        filterMenu.style.display = "none";
      }
    });
  });
}

function renderHits(overlay: HTMLElement, hits: any[]) {
  overlay.innerHTML = "";
  if (hits.length === 0) {
    overlay.style.display = "none";
    return;
  }

  overlay.style.display = "block";
  hits.forEach((hit) => {
    const item = document.createElement("div");
    Object.assign(item.style, {
      padding: "10px",
      borderBottom: "1px solid #eee",
      cursor: "pointer",
      transition: "background-color 0.2s",
    });
    item.onmouseover = () => (item.style.backgroundColor = "#fb823e10");
    item.onmouseout = () => (item.style.backgroundColor = "#fff");

    const name = document.createElement("div");
    name.textContent = hit.name;
    Object.assign(name.style, {
      fontWeight: "bold",
      color: "#333",
    });

    const desc = document.createElement("div");
    desc.textContent = hit.description;
    Object.assign(desc.style, {
      fontSize: "12px",
      color: "#666",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    });

    item.appendChild(name);
    item.appendChild(desc);

    item.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      window.open(`https://www.npmjs.com/package/${hit.name}`, "_blank");
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
