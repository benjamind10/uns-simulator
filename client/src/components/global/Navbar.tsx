import { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Sun, Moon, Menu, X } from 'lucide-react';

import { useDarkMode } from '../../hooks/useDarkMode';
import { logoutAsync, selectIsAuthenticated } from '../../store/auth';

import type { AppDispatch } from '../../store/store';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, toggleDarkMode] = useDarkMode();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  // Get auth state from Redux
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const handleLogout = async () => {
    try {
      await dispatch(logoutAsync()).unwrap();
      navigate('/');
      setMenuOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-md px-4 py-3 transition-colors">
      <div className="flex justify-between items-center">
        <NavLink
          to="/"
          className="text-xl font-bold text-blue-600 dark:text-white hover:underline"
        >
          UNS Simulator
        </NavLink>

        <div className="flex items-center gap-4 md:hidden">
          <button
            onClick={toggleDarkMode}
            className="text-gray-700 dark:text-gray-200 hover:scale-110 transition"
            aria-label="Toggle Theme"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-gray-700 dark:text-gray-200"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <ul className="hidden md:flex md:items-center md:space-x-6 text-gray-700 dark:text-gray-200">
          {isAuthenticated ? (
            <>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  isActive ? 'font-semibold text-blue-500' : ''
                }
              >
                Admin
              </NavLink>
              <NavLink
                to="/explorer"
                className={({ isActive }) =>
                  isActive ? 'font-semibold text-blue-500' : ''
                }
              >
                Explorer
              </NavLink>
              <NavLink
                to="/schema-builder"
                className={({ isActive }) =>
                  isActive ? 'font-semibold text-blue-500' : ''
                }
              >
                Schema Builder
              </NavLink>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate('/')}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
            >
              Login
            </button>
          )}
          <button
            onClick={toggleDarkMode}
            className="text-gray-700 dark:text-gray-200 hover:scale-110 transition"
            aria-label="Toggle Theme"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </ul>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden mt-3 space-y-3 text-gray-700 dark:text-gray-200">
          {isAuthenticated ? (
            <>
              <NavLink
                to="/dashboard"
                onClick={closeMenu}
                className={({ isActive }) =>
                  `block ${isActive ? 'font-semibold text-blue-500' : ''}`
                }
              >
                Admin
              </NavLink>
              <NavLink
                to="/explorer"
                onClick={closeMenu}
                className={({ isActive }) =>
                  `block ${isActive ? 'font-semibold text-blue-500' : ''}`
                }
              >
                Explorer
              </NavLink>
              <NavLink
                to="/schema-builder"
                onClick={closeMenu}
                className={({ isActive }) =>
                  `block ${isActive ? 'font-semibold text-blue-500' : ''}`
                }
              >
                Schema Builder
              </NavLink>
              <button
                onClick={handleLogout}
                className="block w-full text-left bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                navigate('/');
                closeMenu();
              }}
              className="block w-full text-left bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Login
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
