import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth/store";
import { Titlebar } from "@/components/shell/Titlebar";
import { ZoomControls } from "@/components/shell/ZoomControls";
import { AppLayout } from "@/components/shell/AppLayout";
import { AuthPage } from "@/pages/AuthPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { BoardsPage } from "@/pages/BoardsPage";
import { NotesPage } from "@/pages/NotesPage";
import { CalendarPage } from "@/pages/CalendarPage";
import { FilesPage } from "@/pages/FilesPage";

export function App() {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const checkSession = useAuthStore((s) => s.checkSession);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  if (loading) {
    return (
      <div className="app-shell">
        <Titlebar />
        <div className="auth-layout">
          <p style={{ color: "var(--color-text-tertiary)" }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <ZoomControls />
      <div className="app-shell">
        <Titlebar />
        {user ? (
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/boards" element={<BoardsPage />} />
              <Route path="/notes" element={<NotesPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/files" element={<FilesPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        ) : (
          <Routes>
            <Route path="*" element={<AuthPage />} />
          </Routes>
        )}
      </div>
    </BrowserRouter>
  );
}
