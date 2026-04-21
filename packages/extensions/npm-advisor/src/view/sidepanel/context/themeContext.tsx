/**
 * External dependencies.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";

interface ThemeContextProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextProps>({
  isDarkMode: false,
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: PropsWithChildren) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    chrome.storage.local.get(["npmAdvisorDarkMode"], (res) => {
      const dark = !!res.npmAdvisorDarkMode;
      setIsDarkMode(dark);
    });

    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      area: string,
    ) => {
      if (area === "local" && changes.npmAdvisorDarkMode !== undefined) {
        setIsDarkMode(!!changes.npmAdvisorDarkMode.newValue);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const toggleTheme = useCallback(() => {
    setIsDarkMode((prev) => {
      const newVal = !prev;
      chrome.storage.local.set({ npmAdvisorDarkMode: newVal });
      return newVal;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
