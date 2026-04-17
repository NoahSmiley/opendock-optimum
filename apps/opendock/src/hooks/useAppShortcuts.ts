import { useEffect } from "react";
import type { Tool } from "@/types";

interface Options {
  setTool: (t: Tool) => void;
  onNewNote: () => void;
  onFocusSearch: () => void;
}

export function useAppShortcuts({ setTool, onNewNote, onFocusSearch }: Options) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const target = e.target as HTMLElement | null;
      const editing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (e.key === "n" && !editing) { e.preventDefault(); onNewNote(); return; }
      if (e.key === "f") { e.preventDefault(); onFocusSearch(); return; }
      if (e.key === "1") { e.preventDefault(); setTool("notes"); return; }
      if (e.key === "2") { e.preventDefault(); setTool("boards"); return; }
      if (e.key === "3") { e.preventDefault(); setTool("calendar"); return; }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setTool, onNewNote, onFocusSearch]);
}
