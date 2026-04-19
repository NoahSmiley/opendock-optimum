import { useCallback, useEffect, useRef, useState } from "react";
import { activeState, type ToolbarState } from "./state";
import { normalizeChecklists } from "./normalize";

export function useRichEditor(value: string, onChange: (html: string) => void) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<ToolbarState>(emptyState);
  const savedRange = useRef<Range | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (document.activeElement === el) return;
    if (el.innerHTML !== value) {
      el.innerHTML = value;
      normalizeChecklists(el);
    }
  }, [value]);

  const emit = useCallback(() => {
    const el = ref.current;
    if (el) onChange(el.innerHTML);
  }, [onChange]);

  const refreshActive = useCallback(() => {
    setActive(activeState(ref.current));
  }, []);

  const saveRange = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && ref.current?.contains(sel.anchorNode)) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
    }
  }, []);

  useEffect(() => {
    const onSel = () => {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && ref.current?.contains(sel.anchorNode)) {
        savedRange.current = sel.getRangeAt(0).cloneRange();
      }
    };
    document.addEventListener("selectionchange", onSel);
    return () => document.removeEventListener("selectionchange", onSel);
  }, []);

  const restoreRange = useCallback(() => {
    const r = savedRange.current;
    if (!r) return;
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(r);
  }, []);

  const doCmd = useCallback((fn: () => void) => {
    const el = ref.current;
    const sel = window.getSelection();
    const hasLiveSelection = sel && sel.rangeCount > 0 && el?.contains(sel.anchorNode) && !sel.isCollapsed;
    if (hasLiveSelection) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
    } else {
      if (el && document.activeElement !== el) el.focus();
      restoreRange();
    }
    fn();
    saveRange();
    emit();
    refreshActive();
  }, [emit, refreshActive, restoreRange, saveRange]);

  const onSelectionChange = useCallback(() => {
    refreshActive();
    saveRange();
  }, [refreshActive, saveRange]);

  return { ref, active, emit, doCmd, saveRange, onSelectionChange };
}

const emptyState: ToolbarState = {
  bold: false, italic: false, underline: false, strike: false,
  ul: false, ol: false, check: false,
  h1: false, h2: false, h3: false,
};
