import type { ReactNode } from "react";
import type { Tool, MobileView } from "@/types";
import { useAuth } from "@/stores/auth";

const tools: { id: Tool; label: string }[] = [
  { id: "notes", label: "Notes" },
  { id: "boards", label: "Boards" },
];

interface ShellProps { tool: Tool; setTool: (t: Tool) => void; mobileView: MobileView; children: ReactNode }

export function Shell({ tool, setTool, mobileView, children }: ShellProps) {
  const displayName = useAuth((s) => s.data.display_name);
  const email = useAuth((s) => s.data.email);
  const logout = useAuth((s) => s.logout);
  const label = displayName || email || "";
  const initial = label.charAt(0).toUpperCase() || "?";

  return (
    <div className="shell" data-mobile-view={mobileView}>
      <nav className="nav-rail">
        <div className="nav-tools">
          {tools.map((t) => <button key={t.id} className={`nav-tool${tool === t.id ? " active" : ""}`} onClick={() => setTool(t.id)}>{t.label}</button>)}
        </div>
        <div className="nav-user">
          <div className="nav-user-avatar">{initial}</div>
          <div className="nav-user-label" title={email}>{label}</div>
          <button className="nav-user-logout" onClick={logout} title="Sign out">↪</button>
        </div>
      </nav>
      <nav className="tab-bar">
        {tools.map((t) => <button key={t.id} className={`tab${tool === t.id ? " active" : ""}`} onClick={() => setTool(t.id)}>{t.label}</button>)}
      </nav>
      <div className="shell-content">{children}</div>
    </div>
  );
}
