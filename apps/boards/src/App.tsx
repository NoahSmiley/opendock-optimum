import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "./theme-provider";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import DashboardPage from "@/pages/DashboardPage";
import BoardsPage from "@/pages/BoardsPage";
import ProjectsPage from "@/pages/ProjectsPage";
import RoadmapPage from "@/pages/RoadmapPage";
import AboutPage from "@/pages/AboutPage";
import AuthPage from "@/pages/AuthPage";
import NotFoundPage from "@/pages/NotFoundPage";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route
              path="/boards"
              element={
                <RequireAuth>
                  <BoardsPage />
                </RequireAuth>
              }
            />
            <Route
              path="/"
              element={
                <RequireAuth>
                  <AppLayout />
                </RequireAuth>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="roadmap" element={<RoadmapPage />} />
              <Route path="about" element={<AboutPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
