import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Kanban,
  NotebookPen,
  Calendar,
  FolderOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Bot,
  LogOut,
} from "lucide-react";
import { useUiStore } from "@/stores/ui/store";
import { useClaudeStore } from "@/stores/claude/store";
import { useAuthStore } from "@/stores/auth/store";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/boards", icon: Kanban, label: "Boards" },
  { to: "/notes", icon: NotebookPen, label: "Notes" },
  { to: "/calendar", icon: Calendar, label: "Calendar" },
  { to: "/files", icon: FolderOpen, label: "Files" },
] as const;

function ClaudeButton() {
  const togglePanel = useClaudeStore((s) => s.togglePanel);
  const panelOpen = useClaudeStore((s) => s.panelOpen);

  return (
    <button
      className={`sidebar-nav-item ${panelOpen ? "active" : ""}`}
      onClick={togglePanel}
      aria-label="Toggle Claude"
    >
      <Bot />
      <span className="sidebar-nav-label">Claude</span>
    </button>
  );
}

function SignOutButton() {
  const logout = useAuthStore((s) => s.logout);

  return (
    <button className="sidebar-nav-item" onClick={logout} aria-label="Sign out">
      <LogOut />
      <span className="sidebar-nav-label">Sign Out</span>
    </button>
  );
}

export function Sidebar() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);

  return (
    <nav className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-nav">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar-nav-item ${isActive ? "active" : ""}`
            }
          >
            <Icon />
            <span className="sidebar-nav-label">{label}</span>
          </NavLink>
        ))}
      </div>
      <div className="sidebar-footer">
        <ClaudeButton />
        <SignOutButton />
        <button
          className="sidebar-nav-item"
          onClick={toggleSidebar}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          <span className="sidebar-nav-label">Collapse</span>
        </button>
      </div>
    </nav>
  );
}
