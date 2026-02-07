import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import ErrorBoundary from './components/ErrorBoundary';
import PublicLayout from './layout/PublicLayout';
import AppShell from './layout/AppShell';
import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import NotFoundPage from './pages/public/NotFoundPage';
import HomePage from './pages/app/HomePage';
import BrokersPage from './pages/app/BrokersPage';
import MqttExplorerPage from './pages/private/MqttExplorerPage';
import SchemaBuilderPage from './pages/private/SchemaBuilderPage';
import SimulationPage from './pages/private/SimulationPage';

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* ---------- PUBLIC ROUTES ---------- */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* ---------- APP ROUTES (unified shell) ---------- */}
          <Route element={<AppShell />}>
            <Route path="/app" element={<HomePage />} />
            <Route path="/app/simulator" element={<SimulationPage />} />
            <Route
              path="/app/simulator/:profileId"
              element={<SimulationPage />}
            />
            <Route path="/app/schemas" element={<SchemaBuilderPage />} />
            <Route
              path="/app/schemas/:schemaId"
              element={<SchemaBuilderPage />}
            />
            <Route path="/app/explorer" element={<MqttExplorerPage />} />
            <Route path="/app/brokers" element={<BrokersPage />} />
          </Route>

          {/* ---------- LEGACY REDIRECTS ---------- */}
          <Route
            path="/dashboard"
            element={<Navigate to="/app" replace />}
          />
          <Route
            path="/dashboard/*"
            element={<Navigate to="/app" replace />}
          />
          <Route
            path="/simulator"
            element={<Navigate to="/app/simulator" replace />}
          />
          <Route
            path="/simulator/:profileId"
            element={<Navigate to="/app/simulator" replace />}
          />
          <Route
            path="/schema-builder"
            element={<Navigate to="/app/schemas" replace />}
          />
          <Route
            path="/schema-builder/:schemaId"
            element={<Navigate to="/app/schemas" replace />}
          />
          <Route
            path="/explorer"
            element={<Navigate to="/app/explorer" replace />}
          />

          {/* ---------- 404 ---------- */}
          <Route element={<PublicLayout />}>
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
