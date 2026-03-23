async function main() {
  const url = window.location.href;
  let packageName: string | null = null;

  // 1. Detect if on npmjs.com package page
  // Example: https://www.npmjs.com/package/axios
  if (url.includes("npmjs.com/package/")) {
    const match = url.match(/npmjs\.com\/package\/([^/?#]+)/);
    if (match && match[1]) {
      // Decode taking care of scoped packages like @types/react
      packageName = decodeURIComponent(match[1]);
    }
  }

  // 2. Detect if on Github package.json page
  // Example: https://github.com/axios/axios/blob/v1.x/package.json
  else if (
    url.includes("github.com") &&
    url.endsWith("package.json") &&
    url.includes("/blob/")
  ) {
    // Wait slightly for DOM to load if on a raw page or React app, then parse raw lines
    // Alternatively, fetch the raw package.json directly
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
    console.log(`[NPM Advisor] Detected package name: ${packageName}`);
    // Send background PREFETCH message
    chrome.runtime.sendMessage({ type: "PREFETCH", packageName });

    console.log(
      "[NPM Advisor] 💡 Open the NPM Advisor extension popup to see a full statistical analysis of this package!",
    );
  } else {
    console.log("[NPM Advisor] No package name detected in the current URL.");
  }
}

// Ensure the page has fully loaded before executing our stats parser
window.addEventListener("load", () => {
  main().catch(console.error);
});
