import { BrowserRouter, Routes, Route } from 'react-router-dom';

import PublicLayout from './layout/PublicLayout';
import DashboardLayout from './layout/DashboardLayout';
import LandingPage from './pages/public/LandingPage';
import BrokersPage from './pages/dashboard/BrokersPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import PrivateLayout from './layout/PrivateLayout';
import MqttExplorerPage from './pages/private/MqttExplorerPage';
import SchemaBuilderPage from './pages/private/SchemaBuilderPage';
import NotFoundPage from './pages/public/NotFoundPage';
import SchemaPage from './pages/dashboard/SchemaPage';
import SimulationPage from './pages/private/SimulationPage';
import SimulatorsPage from './pages/dashboard/SimulatorsPage';

export default function App() {
  // const dispatch = useDispatch<AppDispatch>();
  // const { brokers } = useSelector((state: RootState) => state.brokers);
  // const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  // useEffect(() => {
  //   if (isAuthenticated && brokers.length > 0) {
  //     dispatch(connectToMultipleBrokersAsync(brokers));
  //   }
  // }, [isAuthenticated, brokers, dispatch]);

  return (
    <BrowserRouter>
      <Routes>
        {/* ---------- PUBLIC ROUTES ---------- */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="*" element={<NotFoundPage />} />
          {/* add more marketing / help pages here */}
        </Route>

        {/* ---------- Dashboard ROUTES ---------- */}
        <Route element={<DashboardLayout />}>
          {/* <Route index element={<Dashboard />} /> */}
          <Route path="dashboard/brokers" element={<BrokersPage />} />
          <Route path="dashboard/brokers/:brokerId" element={<BrokersPage />} />
          <Route path="dashboard/simulators" element={<SimulatorsPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="dashboard/schemas" element={<SchemaPage />} />
          {/* <Route path="users"   element={<UsersPage />} /> */}
        </Route>

        {/* ---------- PRIVATE ROUTES ---------- */}
        <Route element={<PrivateLayout />}>
          <Route path="explorer" element={<MqttExplorerPage />} />
          <Route path="schema-builder" element={<SchemaBuilderPage />} />
          <Route path="simulator" element={<SimulationPage />} />
          <Route path="/simulator/:profileId" element={<SimulationPage />} />
          <Route
            path="schema-builder/:schemaId"
            element={<SchemaBuilderPage />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
