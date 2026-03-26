"use client";

// import { motion } from "framer-motion";
import { useEffect, useState, useMemo } from "react";
import Cookies from "js-cookie";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sun, Moon, Monitor } from "lucide-react";

const themes = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Monitor, label: "System" },
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

const ThemeSwitch = () => {
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme());

  useEffect(() => {
    const root = document.documentElement;
    const systemDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const appliedTheme =
      theme === "system" ? (systemDark ? "dark" : "light") : theme;

    root.setAttribute("data-theme", appliedTheme);
    root.classList.toggle("dark", appliedTheme === "dark");

    localStorage.setItem("theme", appliedTheme);
    Cookies.set("theme", theme, { expires: 365 });
  }, [theme]);

  const handleThemeChange = (selectedTheme: Theme) => {
    setTheme(selectedTheme);
  };

  const currentTheme = useMemo(
    () => themes.find((t) => t.value === theme),
    [theme]
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            className="flex items-center justify-center gap-2 border p-2 rounded-lg cursor-pointer w-10"
            aria-label="Toggle Theme Menu"
            type="button"
          >
            <div key={theme}>
              {currentTheme && <currentTheme.icon className="w-4 h-4" />}
            </div>
          </button>
        }
      />

      <DropdownMenuContent align="end" className="w-40">
        {themes.map((themeOption) => (
          <DropdownMenuItem
            key={themeOption.value}
            onClick={() => handleThemeChange(themeOption.value)}
            className={`cursor-pointer ${
              theme === themeOption.value
                ? "text-blue-500 font-semibold"
                : "text-gray-700 dark:text-gray-200"
            }`}
          >
            <themeOption.icon className="w-4 h-4 mr-2" />
            {themeOption.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeSwitch;
