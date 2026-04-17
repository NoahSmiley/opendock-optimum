import type { ReactNode } from "react";
import type { Tool, MobileView } from "@/types";

const tools: { id: Tool; label: string }[] = [
  { id: "notes", label: "Notes" },
  { id: "boards", label: "Boards" },
  { id: "calendar", label: "Calendar" },
];

interface ShellProps { tool: Tool; setTool: (t: Tool) => void; mobileView: MobileView; children: ReactNode }

export function Shell({ tool, setTool, mobileView, children }: ShellProps) {
  return (
    <div className="shell" data-mobile-view={mobileView}>
      <nav className="nav-rail">
        <div className="nav-tools">
          {tools.map((t) => <button key={t.id} className={`nav-tool${tool === t.id ? " active" : ""}`} onClick={() => setTool(t.id)}>{t.label}</button>)}
        </div>
      </nav>
      <nav className="tab-bar">
        {tools.map((t) => <button key={t.id} className={`tab${tool === t.id ? " active" : ""}`} onClick={() => setTool(t.id)}>{t.label}</button>)}
      </nav>
      <div className="shell-content">{children}</div>
    </div>
  );
}
