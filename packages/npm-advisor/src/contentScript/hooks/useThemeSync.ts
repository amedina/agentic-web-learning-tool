import { useState, useEffect } from "react";

/**
 * Syncs the React component's dark mode state with the host page's theme.
 * Detects dark mode from HTML element attributes, class names, or OS preference.
 */
export function useThemeSync() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDark = () => {
      const html = document.documentElement;

      const colorMode =
        html.getAttribute("data-color-mode") ||
        html.getAttribute("data-theme") ||
        document.body.getAttribute("data-color-mode");

      if (colorMode === "dark") {
        setIsDark(true);
        return;
      }
      if (colorMode === "light") {
        setIsDark(false);
        return;
      }

      if (
        html.classList.contains("dark") ||
        document.body.classList.contains("dark")
      ) {
        setIsDark(true);
        return;
      }

      setIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    };

    checkDark();

    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "data-color-mode"],
    });
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class", "data-color-mode"],
    });

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", checkDark);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener("change", checkDark);
    };
  }, []);

  return isDark;
}
