import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Kanban,
  NotebookPen,
  Calendar,
  FolderOpen,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useUiStore } from "@/stores/ui/store";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/boards", icon: Kanban, label: "Boards" },
  { to: "/notes", icon: NotebookPen, label: "Notes" },
  { to: "/calendar", icon: Calendar, label: "Calendar" },
  { to: "/files", icon: FolderOpen, label: "Files" },
] as const;

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
