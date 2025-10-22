import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/AppLayout";
import { RequireAuth } from "./components/auth";
import DashboardPage from "./pages/Dashboard";
import BoardsLanding from "./pages/BoardsLanding";
import AboutPage from "./pages/About";
import RoadmapPage from "./pages/Roadmap";
import AuthPage from "./pages/Auth";
import ProjectDetailPage from "./pages/ProjectDetail";
import LandingPage from "./pages/Landing";
import PricingPage from "./pages/Pricing";
import FeaturesPage from "./pages/Features";

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/features" element={<FeaturesPage />} />
      <Route path="/auth" element={<AuthPage />} />
      
      {/* Private routes - require authentication */}
      <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
        <Route path="/boards" element={<BoardsLanding />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/roadmap" element={<RoadmapPage />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
