"use client";
import { Theme } from "@/lib/constants";
import { useEffect, useState } from "react";

export function useTheme() {
  const [theme, setTheme] = useState<string>(Theme.LIGHT);

  useEffect(() => {
    const saved = localStorage.getItem("theme") || Theme.LIGHT;
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT;
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  return { theme, toggleTheme };
}
