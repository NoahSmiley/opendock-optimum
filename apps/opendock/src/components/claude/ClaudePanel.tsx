import { useEffect, useState, useCallback, useRef } from "react";
import { X, RotateCcw } from "lucide-react";
import { useClaudeStore } from "@/stores/claude/store";
import { useClaudeEvents } from "@/hooks/useClaudeEvents";
import { ClaudeMessages } from "./ClaudeMessages";
import { ClaudeInput } from "./ClaudeInput";
import { ClaudeSetup } from "./ClaudeSetup";

function isTauri(): boolean {
  return "__TAURI_INTERNALS__" in window;
}

const MIN_WIDTH = 280;
const MAX_WIDTH = 700;
const DEFAULT_WIDTH = 360;

export function ClaudePanel() {
  const panelOpen = useClaudeStore((s) => s.panelOpen);
  const closePanel = useClaudeStore((s) => s.closePanel);
  const cliInstalled = useClaudeStore((s) => s.cliInstalled);
  const cliAuthed = useClaudeStore((s) => s.cliAuthed);
  const clearMessages = useClaudeStore((s) => s.clearMessages);
  const error = useClaudeStore((s) => s.error);

  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startW = useRef(DEFAULT_WIDTH);

  useClaudeEvents();

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    startX.current = e.clientX;
    startW.current = width;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [width]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const delta = startX.current - e.clientX;
      const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startW.current + delta));
      setWidth(next);
    };
    const onMouseUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  useEffect(() => {
    if (!isTauri() || !panelOpen || cliInstalled !== null) return;
    (async () => {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        const installed = await invoke<boolean>("check_claude_status");
        useClaudeStore.getState().setCliInstalled(installed);
        if (installed) {
          const authed = await invoke<boolean>("check_claude_auth");
          useClaudeStore.getState().setCliAuthed(authed);
        }
      } catch {
        useClaudeStore.getState().setCliInstalled(false);
      }
    })();
  }, [panelOpen, cliInstalled]);

  if (!panelOpen) return null;

  const needsSetup = isTauri() && (!cliInstalled || !cliAuthed);

  return (
    <div className="claude-panel" style={{ width, minWidth: width }}>
      <div className="claude-resize-handle" onMouseDown={onMouseDown} />
      <div className="claude-panel-header">
        <span className="text-[12px] font-medium text-neutral-300">Claude</span>
        <div className="flex items-center gap-1">
          <button onClick={clearMessages} className="claude-header-btn" title="New conversation">
            <RotateCcw size={13} />
          </button>
          <button onClick={closePanel} className="claude-header-btn" title="Close">
            <X size={14} />
          </button>
        </div>
      </div>

      {error && (
        <div className="claude-error-banner">{error}</div>
      )}

      {needsSetup ? (
        <ClaudeSetup />
      ) : (
        <>
          <ClaudeMessages />
          <ClaudeInput />
        </>
      )}
    </div>
  );
}
