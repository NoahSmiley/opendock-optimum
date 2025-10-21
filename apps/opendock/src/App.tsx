import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { RequireAuth } from "./components/auth";
import DashboardPage from "./pages/Dashboard";
import BoardsLanding from "./pages/BoardsLanding";
import AboutPage from "./pages/About";
import RoadmapPage from "./pages/Roadmap";
import AuthPage from "./pages/Auth";
import ProjectDetailPage from "./pages/ProjectDetail";

export default function App() {
  return (
    <Routes>
      <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
        <Route path="/boards" element={<BoardsLanding />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/roadmap" element={<RoadmapPage />} />
      </Route>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
