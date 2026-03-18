import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, Square, X } from "lucide-react";

export function WindowsWindowControls() {
  if (!("__TAURI_INTERNALS__" in window)) return null;

  const appWindow = getCurrentWindow();

  return (
    <div className="windows-controls">
      <button
        className="windows-control"
        onClick={() => appWindow.minimize()}
        aria-label="Minimize"
      >
        <Minus size={14} />
      </button>
      <button
        className="windows-control"
        onClick={() => appWindow.toggleMaximize()}
        aria-label="Maximize"
      >
        <Square size={12} />
      </button>
      <button
        className="windows-control close"
        onClick={() => appWindow.close()}
        aria-label="Close"
      >
        <X size={14} />
      </button>
    </div>
  );
}
