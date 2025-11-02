import { Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex items-center gap-2 rounded-full border border-neutral-200/70 bg-white/80 px-3 py-1.5 text-xs font-semibold text-neutral-600 shadow-sm transition hover:border-neutral-300 hover:text-neutral-900 dark:border-white/10 dark:bg-dark-bg/80 dark:text-neutral-200 dark:hover:border-white/30"
    >
      {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      {theme === "dark" ? "Dark" : "Light"}
    </button>
  );
}
