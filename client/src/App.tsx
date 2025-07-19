import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';

import PublicLayout from './layout/PublicLayout';
import AdminLayout from './layout/AdminLayout';

import LandingPage from './pages/public/LandingPage';
import BrokersPage from './pages/admin/BrokersPage';
import DashboardPage from './pages/admin/DashboardPage';
// import UsersPage  from './pages/UsersPage';

export default function App() {
  return (
    <Provider store={store}>
      {/* <AuthProvider> */}
      {/* <BrokersProvider> */}
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
            <Route path="dashboard" element={<DashboardPage />} />
            {/* <Route path="users"   element={<UsersPage />} /> */}
          </Route>
        </Routes>
      </BrowserRouter>
      {/* </BrokersProvider> */}
      {/* </AuthProvider> */}
    </Provider>
  );
}
