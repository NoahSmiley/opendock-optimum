import { Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-white/70 px-3 py-2 text-xs font-semibold text-neutral-600 shadow-sm transition hover:border-neutral-300 hover:text-neutral-900 dark:border-white/10 dark:bg-neutral-900/80 dark:text-neutral-200 dark:hover:border-white/30"
    >
      {theme === "dark" ? (
        <div className="flex items-center gap-2">
          <Moon className="h-4 w-4" />
          Dark
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Sun className="h-4 w-4" />
          Light
        </div>
      )}
    </button>
  );
}
