import { useEffect, useCallback, useState } from "react";

export interface ShortcutHandler {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  description: string;
  handler: () => void;
}

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  preventDefault?: boolean;
}

export function useKeyboardShortcuts(
  shortcuts: ShortcutHandler[],
  options: UseKeyboardShortcutsOptions = {}
) {
  const { enabled = true, preventDefault = true } = options;
  const [showHelp, setShowHelp] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in inputs/textareas
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.contentEditable === "true";

      // Allow ? for help even when typing
      if (e.key === "?" && !isTyping) {
        e.preventDefault();
        setShowHelp(prev => !prev);
        return;
      }

      // Skip other shortcuts if typing
      if (isTyping && !e.metaKey && !e.ctrlKey) return;

      const matchingShortcut = shortcuts.find(shortcut => {
        const keyMatches = e.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = !shortcut.ctrl || e.ctrlKey;
        const altMatches = !shortcut.alt || e.altKey;
        const shiftMatches = !shortcut.shift || e.shiftKey;
        const metaMatches = !shortcut.meta || e.metaKey;

        return keyMatches && ctrlMatches && altMatches && shiftMatches && metaMatches;
      });

      if (matchingShortcut) {
        if (preventDefault) {
          e.preventDefault();
          e.stopPropagation();
        }
        matchingShortcut.handler();
      }
    },
    [shortcuts, enabled, preventDefault]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown, enabled]);

  return { showHelp, setShowHelp };
}

// Format shortcut for display
export function formatShortcut(shortcut: ShortcutHandler): string {
  const keys: string[] = [];

  if (shortcut.meta) keys.push("⌘");
  if (shortcut.ctrl) keys.push("Ctrl");
  if (shortcut.alt) keys.push("Alt");
  if (shortcut.shift) keys.push("Shift");

  // Format the key nicely
  const formattedKey = shortcut.key.length === 1
    ? shortcut.key.toUpperCase()
    : shortcut.key.charAt(0).toUpperCase() + shortcut.key.slice(1);

  keys.push(formattedKey);

  return keys.join("+");
}