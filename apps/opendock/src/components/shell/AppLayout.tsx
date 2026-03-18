import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

export function AppLayout() {
  return (
    <div className="app-body">
      <Sidebar />
      <main className="content-area">
        <Outlet />
      </main>
    </div>
  );
}
