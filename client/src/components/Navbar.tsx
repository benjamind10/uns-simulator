
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import { useDarkMode } from '../hooks/useDarkMode';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [darkMode, toggleDarkMode] = useDarkMode();
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem('authToken');
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('authToken');
    setIsLoggedIn(false);
    navigate('/');
  };

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-md px-4 py-3 flex justify-between items-center transition-colors">
      <div className="text-xl font-bold text-blue-600 dark:text-white">UNS Simulator</div>

      <div className="flex items-center gap-4">
        <button
          onClick={toggleDarkMode}
          className="text-gray-700 dark:text-gray-200 hover:scale-110 transition"
          aria-label="Toggle Theme"
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className="md:hidden">
          <button onClick={() => setMenuOpen(!menuOpen)} className="text-gray-700 dark:text-gray-200 focus:outline-none">
            ☰
          </button>
        </div>
      </div>

      <div className={`md:flex md:items-center ${menuOpen ? 'block' : 'hidden'} mt-3 md:mt-0`}>
        <ul className="md:flex md:space-x-6 space-y-2 md:space-y-0">
          {isLoggedIn ? (
            <>
              <li className="text-gray-700 dark:text-gray-200">Welcome!</li>
              <li>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  Logout
                </button>
              </li>
            </>
          ) : (
            <li>
              <button
                onClick={() => navigate('/')}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Login
              </button>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
}
