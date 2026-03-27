"use client";
import Cookies from "js-cookie";
import { useEffect, useState } from "react";

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
  const [theme] = useState<Theme>(getInitialTheme());
  useEffect(() => {
    const root = document.documentElement;
    const systemDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const appliedTheme =
      theme === "system" ? (systemDark ? "dark" : "light") : theme;

    root.setAttribute("data-theme", appliedTheme);
    root.classList.toggle("dark", appliedTheme === "dark");

    localStorage.setItem("theme", appliedTheme);
    Cookies.set("theme", theme, { expires: 365 });
  }, [theme]);
  return <>{children}</>;
};

export default ThemeProvider;
