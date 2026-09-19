import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import DashboardLayout from "./components/layout/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import TrainSearch from "./pages/TrainSearch";
import WhatIfSimulation from "./pages/WhatIfSimulation";
import LiveMonitor from "./pages/LiveMonitor";
import Analytics from "./pages/Analytics";
import PredictionHistory from "./pages/PredictionHistory";
import Login from "./pages/Login";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!user || user.role !== "ADMIN") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="search" element={<TrainSearch />} />
            <Route path="simulate" element={<WhatIfSimulation />} />
            <Route path="monitor" element={<LiveMonitor />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="history" element={<PredictionHistory />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}
