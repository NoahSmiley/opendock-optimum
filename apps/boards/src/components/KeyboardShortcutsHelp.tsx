import { X } from "lucide-react";
import { useEffect } from "react";
import clsx from "clsx";
import type { ShortcutHandler } from "@/hooks/useKeyboardShortcuts";
import { formatShortcut } from "@/hooks/useKeyboardShortcuts";

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: ShortcutHandler[];
}

export function KeyboardShortcutsHelp({
  isOpen,
  onClose,
  shortcuts,
}: KeyboardShortcutsHelpProps) {
  useEffect(() => {
    if (isOpen) {
      // Close on Escape
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape" || e.key === "?") {
          onClose();
        }
      };
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Group shortcuts by category
  const generalShortcuts = shortcuts.filter(s =>
    !s.description.toLowerCase().includes("navigate") &&
    !s.description.toLowerCase().includes("edit")
  );

  const navigationShortcuts = shortcuts.filter(s =>
    s.description.toLowerCase().includes("navigate")
  );

  const editShortcuts = shortcuts.filter(s =>
    s.description.toLowerCase().includes("edit") ||
    s.description.toLowerCase().includes("select")
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 animate-in fade-in zoom-in-95 duration-200">
        <div className="rounded-lg border-2 border-wood-300 bg-gradient-to-br from-paper-50 to-paper-100 shadow-warm-2xl dark:border-wood-700 dark:from-wood-900 dark:to-wood-950">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-wood-200 px-6 py-4 dark:border-wood-800">
            <h2 className="font-display text-xl font-semibold text-wood-900 dark:text-paper-100">
              Keyboard Shortcuts
            </h2>
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-wood-500 transition hover:bg-wood-100 hover:text-wood-900 dark:text-paper-400 dark:hover:bg-wood-800 dark:hover:text-paper-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
            <div className="space-y-6">
              {/* General Shortcuts */}
              {generalShortcuts.length > 0 && (
                <div>
                  <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-wood-600 dark:text-paper-400">
                    General
                  </h3>
                  <div className="space-y-2">
                    {generalShortcuts.map((shortcut, index) => (
                      <ShortcutRow key={index} shortcut={shortcut} />
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation Shortcuts */}
              {navigationShortcuts.length > 0 && (
                <div>
                  <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-wood-600 dark:text-paper-400">
                    Navigation
                  </h3>
                  <div className="space-y-2">
                    {navigationShortcuts.map((shortcut, index) => (
                      <ShortcutRow key={index} shortcut={shortcut} />
                    ))}
                  </div>
                </div>
              )}

              {/* Edit Shortcuts */}
              {editShortcuts.length > 0 && (
                <div>
                  <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-wood-600 dark:text-paper-400">
                    Editing
                  </h3>
                  <div className="space-y-2">
                    {editShortcuts.map((shortcut, index) => (
                      <ShortcutRow key={index} shortcut={shortcut} />
                    ))}
                  </div>
                </div>
              )}

              {/* Help Shortcut */}
              <div>
                <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-wood-600 dark:text-paper-400">
                  Help
                </h3>
                <div className="space-y-2">
                  <ShortcutRow
                    shortcut={{
                      key: "?",
                      description: "Show/hide this help",
                      handler: () => {}
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-wood-200 px-6 py-3 dark:border-wood-800">
            <p className="text-xs text-wood-500 dark:text-paper-500">
              Press <kbd className="rounded bg-wood-200 px-1.5 py-0.5 text-xs font-semibold dark:bg-wood-800">Esc</kbd> or <kbd className="rounded bg-wood-200 px-1.5 py-0.5 text-xs font-semibold dark:bg-wood-800">?</kbd> to close
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function ShortcutRow({ shortcut }: { shortcut: ShortcutHandler }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-wood-50 px-3 py-2 dark:bg-wood-800/50">
      <span className="text-sm text-wood-700 dark:text-paper-300">
        {shortcut.description}
      </span>
      <kbd className={clsx(
        "rounded-md border border-wood-300 bg-gradient-to-b from-paper-50 to-wood-100 px-2 py-1",
        "text-xs font-semibold text-wood-700 shadow-warm-sm",
        "dark:border-wood-600 dark:from-wood-700 dark:to-wood-800 dark:text-paper-200"
      )}>
        {formatShortcut(shortcut)}
      </kbd>
    </div>
  );
}