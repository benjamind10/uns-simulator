import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import { connectToMultipleBrokersAsync } from './store/mqtt/mqttThunk';

import PublicLayout from './layout/PublicLayout';
import AdminLayout from './layout/AdminLayout';

import LandingPage from './pages/public/LandingPage';
import BrokersPage from './pages/admin/BrokersPage';
import DashboardPage from './pages/admin/DashboardPage';
import PrivateLayout from './layout/PrivateLayout';
import MqttExplorerPage from './pages/private/MqttExplorerPage';
import SchemaBuilderPage from './pages/private/SchemaBuilderPage';
import NotFoundPage from './pages/public/NotFoundPage';

import type { AppDispatch, RootState } from './types';
import SchemaPage from './pages/admin/SchemaPage';

export default function App() {
  const dispatch = useDispatch<AppDispatch>();
  const { brokers } = useSelector((state: RootState) => state.brokers);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (isAuthenticated && brokers.length > 0) {
      dispatch(connectToMultipleBrokersAsync(brokers));
    }
  }, [isAuthenticated, brokers, dispatch]);

  return (
    <BrowserRouter>
      <Routes>
        {/* ---------- PUBLIC ROUTES ---------- */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="*" element={<NotFoundPage />} />
          {/* add more marketing / help pages here */}
        </Route>

        {/* ---------- ADMIN ROUTES ---------- */}
        <Route element={<AdminLayout />}>
          {/* <Route index element={<Dashboard />} /> */}
          <Route path="dashboard/brokers" element={<BrokersPage />} />
          <Route
            path="dashboard/brokers/edit/:brokerId"
            element={<BrokersPage />}
          />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="dashboard/schemas" element={<SchemaPage />} />
          {/* <Route path="users"   element={<UsersPage />} /> */}
        </Route>
        <Route element={<PrivateLayout />}>
          <Route path="explorer" element={<MqttExplorerPage />} />
          <Route path="schema-builder" element={<SchemaBuilderPage />} />
          <Route
            path="schema-builder/:schemaId"
            element={<SchemaBuilderPage />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
