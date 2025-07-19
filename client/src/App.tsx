import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import PublicLayout from './layout/PublicLayout';
import AdminLayout from './layout/AdminLayout';

import LandingPage from './pages/public/LandingPage';
import BrokersPage from './pages/admin/BrokersPage';
// import UsersPage  from './pages/UsersPage';
// import Dashboard  from './pages/Dashboard';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ---------- PUBLIC ROUTES ---------- */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            {/* add more marketing / help pages here */}
          </Route>

          {/* ---------- ADMIN ROUTES ---------- */}
          <Route element={<AdminLayout />}>
            {/* <Route index element={<Dashboard />} /> */}
            <Route path="brokers" element={<BrokersPage />} />
            {/* <Route path="users"   element={<UsersPage />} /> */}
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
