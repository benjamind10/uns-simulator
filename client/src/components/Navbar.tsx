import { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { Sun, Moon, Menu, X } from 'lucide-react';
import { useDarkMode } from '../hooks/useDarkMode';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, toggleDarkMode] = useDarkMode();
  const { isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
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
          <NavLink
            to="/explorer"
            className={({ isActive }) =>
              isActive ? 'font-semibold text-blue-500' : ''
            }
          >
            Explorer
          </NavLink>
          <NavLink
            to="/simulator"
            className={({ isActive }) =>
              isActive ? 'font-semibold text-blue-500' : ''
            }
          >
            Simulator
          </NavLink>
          <NavLink
            to="/brokers"
            className={({ isActive }) =>
              isActive ? 'font-semibold text-blue-500' : ''
            }
          >
            Brokers
          </NavLink>

          <button
            onClick={toggleDarkMode}
            className="text-gray-700 dark:text-gray-200 hover:scale-110 transition"
            aria-label="Toggle Theme"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
            >
              Logout
            </button>
          ) : (
            <button
              onClick={() => navigate('/')}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
            >
              Login
            </button>
          )}
        </ul>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden mt-3 space-y-3 text-gray-700 dark:text-gray-200">
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
            to="/simulator"
            onClick={closeMenu}
            className={({ isActive }) =>
              `block ${isActive ? 'font-semibold text-blue-500' : ''}`
            }
          >
            Simulator
          </NavLink>
          <NavLink
            to="/brokers"
            onClick={closeMenu}
            className={({ isActive }) =>
              `block ${isActive ? 'font-semibold text-blue-500' : ''}`
            }
          >
            Brokers
          </NavLink>
          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="block w-full text-left bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Logout
            </button>
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
