import type { ReactNode } from "react";
import type { Tool } from "@/App";

const tools: { id: Tool; label: string }[] = [
  { id: "notes", label: "Notes" },
  { id: "boards", label: "Boards" },
  { id: "calendar", label: "Calendar" },
];

interface Props {
  tool: Tool;
  setTool: (t: Tool) => void;
  mobileView: "list" | "detail";
  children: ReactNode;
}

export function Shell({ tool, setTool, mobileView, children }: Props) {
  return (
    <div className="shell" data-mobile-view={mobileView}>
      {/* Desktop sidebar nav */}
      <nav className="nav-rail">
        <div className="nav-brand">OpenDock</div>
        <div className="nav-tools">
          {tools.map((t) => (
            <button key={t.id} className={`nav-tool${tool === t.id ? " active" : ""}`} onClick={() => setTool(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      </nav>
      {/* Mobile bottom tab bar */}
      <nav className="tab-bar">
        {tools.map((t) => (
          <button key={t.id} className={`tab${tool === t.id ? " active" : ""}`} onClick={() => setTool(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>
      <div className="shell-content">
        {children}
      </div>
    </div>
  );
}
