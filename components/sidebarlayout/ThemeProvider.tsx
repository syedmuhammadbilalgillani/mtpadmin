"use client";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";

const themes = [
  { value: "light", icon: "fas fa-sun text-yellow-500" },
  { value: "dark", icon: "fas fa-moon text-gray-300" },
  { value: "system", icon: "fas fa-desktop text-blue-500" },
] as const;

type Theme = (typeof themes)[number]["value"];

const getInitialTheme = (): Theme => {
  if (typeof window !== "undefined") {
    const storedTheme = Cookies.get("theme") as Theme;
    if (storedTheme && themes.some((t) => t.value === storedTheme)) {
      return storedTheme;
    }
  }
  return "system";
};

const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(getInitialTheme()); 
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initialTheme = getInitialTheme();
    setTheme(initialTheme as Theme);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const root = document.documentElement;
      const systemDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      const appliedTheme =
        theme === "system" ? (systemDark ? "dark" : "light") : theme;

      // Apply the theme to the root element
      root.setAttribute("data-theme", appliedTheme);
      root.classList.toggle("dark", appliedTheme === "dark");

      // Save the theme to localStorage and cookies
      localStorage.setItem("theme", appliedTheme);
      Cookies.set("theme", theme, { expires: 365 }); // Store theme in a cookie for 1 year
    }
  }, [theme, isLoading]);

  if (isLoading) {
    return null; // or a loading spinner
  }

  return <>{children}</>;
};

export default ThemeProvider;
