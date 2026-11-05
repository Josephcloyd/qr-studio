"use client";

import { Moon, Sun } from "lucide-react";
import { create } from "zustand";
import { IconButton } from "@/components/ui/Button";

type Theme = "dark" | "light";

/**
 * UI theme (dark by default, matching the GetLaunch PH family). Held in memory
 * only — QR Studio writes nothing to browser storage — so it resets on reload.
 */
const useTheme = create<{ theme: Theme; toggle: () => void }>((set, get) => ({
  theme: "dark",
  toggle: () => {
    const theme: Theme = get().theme === "dark" ? "light" : "dark";
    if (theme === "light") document.documentElement.dataset.theme = "light";
    else delete document.documentElement.dataset.theme;
    set({ theme });
  },
}));

export function ThemeToggle({ size = "md" }: { size?: "sm" | "md" }) {
  const theme = useTheme((s) => s.theme);
  const toggle = useTheme((s) => s.toggle);
  const label = theme === "dark" ? "Switch to light theme" : "Switch to dark theme";
  return (
    <IconButton label={label} size={size} onClick={toggle}>
      {theme === "dark" ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
    </IconButton>
  );
}
