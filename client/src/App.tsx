import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import LandingPage from './pages/LandingPage';
import Navbar from './components/Navbar';
import { AuthProvider } from './context/AuthContext';
// // import Dashboard from './pages/Dashboard'
// import ExplorerPage from './pages/ExplorerPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          {/* <Route path="/dashboard" element={<Dashboard />} /> */}
          {/* <Route path="/explorer" element={<ExplorerPage />} /> */}
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
