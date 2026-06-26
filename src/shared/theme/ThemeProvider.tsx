import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { AppSettings } from "@/shared/types/proxy";

type Theme = AppSettings["theme"];

type ThemeProviderProps = {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "term-proxy-ui-theme",
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const storedTheme = globalThis.localStorage?.getItem(storageKey);

    return isTheme(storedTheme) ? storedTheme : defaultTheme;
  });

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = globalThis.matchMedia?.("(prefers-color-scheme: dark)") ?? null;

    function applyTheme() {
      const prefersDark = mediaQuery?.matches ?? false;
      const shouldUseDark = theme === "dark" || (theme === "system" && prefersDark);

      root.classList.toggle("dark", shouldUseDark);
    }

    applyTheme();
    mediaQuery?.addEventListener?.("change", applyTheme);

    return () => {
      mediaQuery?.removeEventListener?.("change", applyTheme);
    };
  }, [theme]);

  const setTheme = useCallback(
    (nextTheme: Theme) => {
      globalThis.localStorage?.setItem(storageKey, nextTheme);
      setThemeState(nextTheme);
    },
    [storageKey],
  );

  const value = useMemo<ThemeProviderState>(
    () => ({
      theme,
      setTheme,
    }),
    [setTheme, theme],
  );

  return (
    <ThemeProviderContext.Provider value={value}>{children}</ThemeProviderContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeProviderContext);
}

function isTheme(value: string | null): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}
