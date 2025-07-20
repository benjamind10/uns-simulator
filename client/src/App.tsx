import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';

import PublicLayout from './layout/PublicLayout';
import AdminLayout from './layout/AdminLayout';

import LandingPage from './pages/public/LandingPage';
import BrokersPage from './pages/admin/BrokersPage';
import DashboardPage from './pages/admin/DashboardPage';
import PrivateLayout from './layout/PrivateLayout';
import MqttExplorerPage from './pages/private/MqttExplorerPage';
import SchemaBuilderPage from './pages/private/SchemaBuilderPage';
import NotFoundPage from './pages/public/NotFoundPage';
// import UsersPage  from './pages/UsersPage';

export default function App() {
  return (
    <Provider store={store}>
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
            <Route path="brokers" element={<BrokersPage />} />
            <Route path="brokers/edit/:brokerId" element={<BrokersPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            {/* <Route path="users"   element={<UsersPage />} /> */}
          </Route>
          <Route element={<PrivateLayout />}>
            <Route path="explorer" element={<MqttExplorerPage />} />
            <Route path="schema-builder" element={<SchemaBuilderPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}
