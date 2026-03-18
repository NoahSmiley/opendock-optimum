import { useEffect, useState } from "react";
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

function isTauri(): boolean {
  return "__TAURI_INTERNALS__" in window;
}

export function App() {
  if (isTauri()) return <TauriApp />;
  return <BrowserApp />;
}

function TauriApp() {
  const [ssoChecked, setSsoChecked] = useState(false);
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const checkSession = useAuthStore((s) => s.checkSession);

  // Check Athion SSO status, then always check backend session for CSRF
  useEffect(() => {
    (async () => {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        await invoke<{ logged_in: boolean }>("get_auth_status");
      } catch { /* ignore */ }
      setSsoChecked(true);
      checkSession();
    })();
  }, [checkSession]);

  if (!ssoChecked || loading) {
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
        {user ? <AuthenticatedRoutes /> : (
          <Routes><Route path="*" element={<AuthPage />} /></Routes>
        )}
      </div>
    </BrowserRouter>
  );
}

function BrowserApp() {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const checkSession = useAuthStore((s) => s.checkSession);

  useEffect(() => { checkSession(); }, [checkSession]);

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
        {user ? <AuthenticatedRoutes /> : (
          <Routes><Route path="*" element={<AuthPage />} /></Routes>
        )}
      </div>
    </BrowserRouter>
  );
}

function AuthenticatedRoutes() {
  return (
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
  );
}
