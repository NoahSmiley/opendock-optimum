import { useEffect, useState, useCallback } from "react";
import { OpenDockLogo } from "@/components/shared/OpenDockLogo";
import { useUiStore } from "@/stores/ui/store";

export function Titlebar() {
  const [Controls, setControls] = useState<React.ComponentType | null>(null);
  const [isMac, setIsMac] = useState(false);
  const collapsed = useUiStore((s) => s.sidebarCollapsed);

  useEffect(() => {
    const mac = navigator.platform.toUpperCase().includes("MAC");
    setIsMac(mac);

    if (mac) {
      import("./MacWindowControls").then((mod) =>
        setControls(() => mod.MacWindowControls),
      );
    } else {
      import("./WindowsWindowControls").then((mod) =>
        setControls(() => mod.WindowsWindowControls),
      );
    }
  }, []);

  const handleMouseDown = useCallback(async (e: React.MouseEvent) => {
    if (!("__TAURI_INTERNALS__" in window)) return;
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest("button, a, input, [data-no-drag]")) return;

    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().startDragging();
    } catch {
      // Fallback to CSS -webkit-app-region: drag
    }
  }, []);

  const sidebarW = collapsed ? "var(--sidebar-collapsed-width)" : "var(--sidebar-width)";

  return (
    <div className="titlebar" onMouseDown={handleMouseDown}>
      {isMac && Controls && (
        <div data-no-drag>
          <Controls />
        </div>
      )}
      <div className="absolute top-1/2"
        style={{ left: `calc(50% + ${sidebarW} / 2)`, transform: "translate(-50%, -50%)", transition: "left 180ms ease" }}>
        <OpenDockLogo size={24} />
      </div>
      {!isMac && Controls && (
        <div className="titlebar-controls" data-no-drag>
          <Controls />
        </div>
      )}
    </div>
  );
}
