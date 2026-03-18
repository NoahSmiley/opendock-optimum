import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { ClaudePanel } from "@/components/claude/ClaudePanel";

export function AppLayout() {
  return (
    <div className="app-body">
      <Sidebar />
      <main className="content-area">
        <Outlet />
      </main>
      <ClaudePanel />
    </div>
  );
}
