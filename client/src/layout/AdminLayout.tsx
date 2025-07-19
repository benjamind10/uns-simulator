import { useState, Fragment } from 'react';
import { Outlet, NavLink, useLocation, Link } from 'react-router-dom';
import { Menu, X, Home, User, Server, Sun, Moon } from 'lucide-react';
import clsx from 'clsx';
import { useDarkMode } from '../hooks/useDarkMode';
import Toast from '../components/Toast';

export default function AdminLayout() {
  const [open, setOpen] = useState(true); // side-nav expanded?
  const location = useLocation();
  const [darkMode, toggleDarkMode] = useDarkMode(); // custom hook

  /* Build breadcrumb from path segments */
  const crumbs = location.pathname
    .split('/')
    .filter(Boolean) // remove empty
    .map((seg, idx, arr) => ({
      label: seg.charAt(0).toUpperCase() + seg.slice(1),
      to: '/' + arr.slice(0, idx + 1).join('/'),
      last: idx === arr.length - 1,
    }));

  return (
    <>
      <Toast />
      <div className="flex h-screen w-screen overflow-hidden text-gray-800 dark:text-gray-100">
        {/* ───────────── SIDE NAV ───────────── */}
        <aside
          className={clsx(
            'bg-gray-100 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all',
            open ? 'w-56' : 'w-16'
          )}
        >
          {/* burger / close */}
          <button
            onClick={() => setOpen(!open)}
            className="p-3 text-gray-600 dark:text-gray-300 focus:outline-none"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>

          <nav className="mt-6 flex flex-col gap-2">
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  clsx(
                    'mx-2 flex items-center gap-3 rounded px-3 py-2 hover:bg-blue-500/10 transition-colors',
                    isActive &&
                      'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                  )
                }
              >
                <Icon size={20} />
                {open && <span className="truncate">{label}</span>}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* ───────────── MAIN ───────────── */}
        <div className="flex flex-1 flex-col overflow-y-auto bg-gray-50 dark:bg-gray-900">
          {/* Top Bar */}
          <header className="sticky top-0 z-10 h-14 flex items-center justify-between bg-white/80 dark:bg-gray-900/80 backdrop-blur px-4 shadow-sm">
            {/* Breadcrumb */}
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-2 text-sm"
            >
              <Link
                to="/"
                className="hover:underline text-gray-600 dark:text-gray-300"
              >
                Dashboard
              </Link>
              {crumbs.map(({ label, to, last }) => (
                <Fragment key={to}>
                  <span>/</span>
                  {last ? (
                    <span className="font-medium">{label}</span>
                  ) : (
                    <Link
                      to={to}
                      className="hover:underline text-gray-600 dark:text-gray-300"
                    >
                      {label}
                    </Link>
                  )}
                </Fragment>
              ))}
            </nav>

            {/* Right-side buttons */}
            <div className="flex items-center gap-4">
              {/* dark-mode toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                aria-label="Toggle theme"
              >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* Placeholder: profile dropdown */}
              {/* <ProfileMenu /> */}
            </div>
          </header>

          {/* Routed page content */}
          <main className="flex-1 overflow-y-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}

/* -------- navigation items -------- */
const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  { to: '/Profile', label: 'Profile', icon: User },
  { to: '/brokers', label: 'Brokers', icon: Server },
  //   { to: '/settings', label: 'Settings', icon: Settings },
] as const;
