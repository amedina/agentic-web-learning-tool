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
  }
}

function setupSearchOverlay() {
  const searchInput = document.querySelector(
    'input[aria-label="Search packages"]',
  ) as HTMLInputElement;
  if (!searchInput) return;

  const searchForm = searchInput.closest("form");
  if (!searchForm) return;

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

  // Ensure parent has relative position
  const searchFormParent = searchInput.parentElement;
  if (searchFormParent) {
    searchFormParent.style.position = "relative";
    searchFormParent.appendChild(overlay);
  }

  let debounceTimer: any;

  searchInput.addEventListener("input", (e) => {
    const query = (e.target as HTMLInputElement).value;
    clearTimeout(debounceTimer);

    if (!query.trim()) {
      overlay.style.display = "none";
      return;
    }

    debounceTimer = setTimeout(() => {
      chrome.runtime.sendMessage({ type: "SEARCH_NPM", query }, (response) => {
        if (response && response.success) {
          renderHits(overlay, response.hits);
        } else {
          console.error(
            "[NPM Advisor] Search failed:",
            response ? response.error : "No response",
          );
        }
      });
    }, 200);
  });

  // Hide overlay on click outside
  document.addEventListener("click", (e) => {
    if (!searchForm.contains(e.target as Node)) {
      overlay.style.display = "none";
    }
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
