import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Navbar from './components/Navbar';
// // import Dashboard from './pages/Dashboard'
// import ExplorerPage from './pages/ExplorerPage';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        {/* <Route path="/dashboard" element={<Dashboard />} /> */}
        {/* <Route path="/explorer" element={<ExplorerPage />} /> */}
      </Routes>
    </Router>
  );
}

export default App;