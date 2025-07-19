import { Outlet, NavLink } from 'react-router-dom';
import {
  Server,
  Terminal,
  Settings,
  LayoutDashboard,
  FileJson,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useDarkMode } from '../hooks/useDarkMode';
import clsx from 'clsx';

export default function PrivateLayout() {
  const [darkMode, toggleDarkMode] = useDarkMode();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex dark:bg-gray-900">
      {/* Side Navigation */}
      <nav className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        {/* Logo Area */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold">UNS Simulator</h1>
        </div>

        {/* Nav Links */}
        <div className="p-4 space-y-2">
          {NAV_ITEMS.map(({ label, icon: Icon, to }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-4 py-2 rounded-lg transition-colors',
                  'hover:bg-gray-100 dark:hover:bg-gray-700',
                  isActive &&
                    'bg-blue-50 text-blue-600 dark:bg-gray-700 dark:text-blue-400'
                )
              }
            >
              <Icon size={20} />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>

        {/* User Section */}
        <div className="absolute bottom-0 w-64 border-t border-gray-200 dark:border-gray-700">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                {user?.email?.[0].toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{user?.email}</span>
                <button
                  onClick={logout}
                  className="text-xs text-gray-500 hover:text-red-500 flex items-center gap-1"
                >
                  <LogOut size={12} />
                  Sign out
                </button>
              </div>
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              {darkMode ? '🌞' : '🌙'}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    to: '/dashboard',
  },
  {
    label: 'MQTT Explorer',
    icon: Terminal,
    to: '/mqtt-explorer',
  },
  {
    label: 'Schema Builder',
    icon: FileJson,
    to: '/schema-builder',
  },
  {
    label: 'Simulator',
    icon: Server,
    to: '/simulator',
  },
  {
    label: 'Settings',
    icon: Settings,
    to: '/settings',
  },
];
