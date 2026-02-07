import { useNavigate, NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Sun, Moon } from 'lucide-react';

import { useDarkMode } from '../../hooks/useDarkMode';
import { selectIsAuthenticated } from '../../store/auth';
import logo from '../../assets/logo.webp';

export default function Navbar() {
  const [darkMode, toggleDarkMode] = useDarkMode();
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  return (
    <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-800/50 px-6 py-3 transition-colors">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <NavLink
          to="/"
          className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white"
        >
          <img src={logo} alt="Logo" className="h-7 w-7" />
          UNS Simulator
        </NavLink>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle Theme"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {isAuthenticated ? (
            <button
              onClick={() => navigate('/app')}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Go to App
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <NavLink
                to="/login"
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Login
              </NavLink>
              <NavLink
                to="/register"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Sign Up
              </NavLink>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
